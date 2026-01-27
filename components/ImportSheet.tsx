import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, Input } from './ui';
import { parseImportFile, importedContactToPerson, findPotentialMatches } from '../lib/imports';
import { usePeopleStore } from '../stores/peopleStore';
import type { ImportedContact } from '../lib/types';

interface ImportSheetProps {
  visible: boolean;
  onClose: () => void;
}

type ImportSource = 'whatsapp' | 'discord' | 'email';

export function ImportSheet({ visible, onClose }: ImportSheetProps) {
  const [step, setStep] = useState<'source' | 'upload' | 'review'>('source');
  const [source, setSource] = useState<ImportSource>('whatsapp');
  const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [myEmail, setMyEmail] = useState('');
  
  const { addPerson, people } = usePeopleStore();
  
  const sources = [
    { 
      id: 'whatsapp' as const, 
      name: 'WhatsApp', 
      emoji: '💬',
      description: 'Export a chat from WhatsApp and upload the .txt file',
      instructions: 'Open chat → ⋮ → More → Export chat → Without Media',
    },
    { 
      id: 'discord' as const, 
      name: 'Discord', 
      emoji: '🎮',
      description: 'Paste copied Discord messages or upload export',
      instructions: 'Select messages → Copy → Paste here',
    },
    { 
      id: 'email' as const, 
      name: 'Email', 
      emoji: '📧',
      description: 'Upload .mbox or .eml files from your email',
      instructions: 'Export from Gmail/Outlook settings',
    },
  ];
  
  const handleSelectSource = (s: ImportSource) => {
    setSource(s);
    setStep('upload');
  };
  
  const handleFilePick = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/json', 'application/mbox', 'message/rfc822'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const file = result.assets[0];
      
      // Read file content
      const response = await fetch(file.uri);
      const content = await response.text();
      
      // Parse the file
      const { contacts, contexts } = await parseImportFile(
        file.name,
        content,
        source === 'email' ? myEmail : undefined
      );
      
      if (contacts.length === 0) {
        Alert.alert('No contacts found', 'Could not find any contacts in this file.');
        setLoading(false);
        return;
      }
      
      setImportedContacts(contacts);
      setSelectedContacts(new Set(contacts.map(c => c.name)));
      setStep('review');
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import failed', 'Could not read the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImport = async () => {
    setLoading(true);
    
    try {
      const toImport = importedContacts.filter(c => selectedContacts.has(c.name));
      
      // Find matches with existing people
      const matches = findPotentialMatches(toImport, people);
      
      let imported = 0;
      let skipped = 0;
      
      for (const contact of toImport) {
        const existingMatch = matches.get(contact);
        
        if (existingMatch) {
          // Already exists - skip for now (could merge in future)
          skipped++;
          continue;
        }
        
        // Create new person
        await addPerson({
          name: contact.name,
          relationship: 'acquaintance',
          notes: '',
          tags: [contact.source],
          last_contacted_at: contact.last_message_date,
        });
        
        imported++;
      }
      
      Alert.alert(
        'Import complete',
        `Added ${imported} new contacts${skipped > 0 ? `, skipped ${skipped} that already exist` : ''}.`
      );
      
      // Reset and close
      setStep('source');
      setImportedContacts([]);
      setSelectedContacts(new Set());
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleContact = (name: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedContacts(newSelected);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
          <Pressable onPress={step === 'source' ? onClose : () => setStep('source')}>
            <Text className="text-primary-500 text-base">
              {step === 'source' ? 'Cancel' : '← Back'}
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold">Import Contacts</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <ScrollView className="flex-1 p-4">
          {step === 'source' && (
            <>
              <Text className="text-base text-gray-600 mb-4">
                Import contacts from your messaging apps to get started quickly.
              </Text>
              
              {sources.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => handleSelectSource(s.id)}
                  className="mb-3"
                >
                  <Card variant="outline" className="active:bg-gray-50">
                    <View className="flex-row items-start">
                      <Text className="text-3xl mr-4">{s.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">{s.name}</Text>
                        <Text className="text-sm text-gray-600 mt-1">{s.description}</Text>
                      </View>
                      <Text className="text-gray-400">→</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </>
          )}
          
          {step === 'upload' && (
            <>
              <Card className="mb-4">
                <Text className="text-lg font-semibold mb-2">
                  {sources.find(s => s.id === source)?.name} Import
                </Text>
                <Text className="text-sm text-gray-600 mb-4">
                  {sources.find(s => s.id === source)?.instructions}
                </Text>
                
                {source === 'email' && (
                  <View className="mb-4">
                    <Input
                      label="Your email address"
                      value={myEmail}
                      onChangeText={setMyEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
                
                <Button
                  title="Choose File"
                  onPress={handleFilePick}
                  loading={loading}
                  fullWidth
                />
              </Card>
            </>
          )}
          
          {step === 'review' && (
            <>
              <Text className="text-base text-gray-600 mb-4">
                Found {importedContacts.length} contacts. Select which to import:
              </Text>
              
              <Pressable
                onPress={() => {
                  if (selectedContacts.size === importedContacts.length) {
                    setSelectedContacts(new Set());
                  } else {
                    setSelectedContacts(new Set(importedContacts.map(c => c.name)));
                  }
                }}
                className="mb-4"
              >
                <Text className="text-primary-500 font-medium">
                  {selectedContacts.size === importedContacts.length ? 'Deselect All' : 'Select All'}
                </Text>
              </Pressable>
              
              {importedContacts.map((contact, i) => (
                <Pressable
                  key={`${contact.name}-${i}`}
                  onPress={() => toggleContact(contact.name)}
                  className={`flex-row items-center p-4 bg-white rounded-xl mb-2 ${
                    selectedContacts.has(contact.name) ? 'border-2 border-primary-500' : 'border border-gray-200'
                  }`}
                >
                  <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedContacts.has(contact.name) 
                      ? 'bg-primary-500 border-primary-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedContacts.has(contact.name) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{contact.name}</Text>
                    {contact.message_count && (
                      <Text className="text-sm text-gray-500">
                        {contact.message_count} messages
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
              
              <View className="mt-4">
                <Button
                  title={`Import ${selectedContacts.size} Contacts`}
                  onPress={handleImport}
                  loading={loading}
                  disabled={selectedContacts.size === 0}
                  fullWidth
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

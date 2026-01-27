import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import { Button, Input, Avatar, Card } from './ui';
import type { Person } from '../lib/types';
import { useInteractionsStore } from '../stores/interactionsStore';
import { usePeopleStore } from '../stores/peopleStore';

interface QuickLogSheetProps {
  visible: boolean;
  onClose: () => void;
  preselectedPerson?: Person;
}

export function QuickLogSheet({ visible, onClose, preselectedPerson }: QuickLogSheetProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(preselectedPerson || null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<'good' | 'okay' | 'awkward'>('good');
  const [interactionType, setInteractionType] = useState<'in_person' | 'call' | 'text' | 'video'>('in_person');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'person' | 'details'>(preselectedPerson ? 'details' : 'person');
  
  const { addInteraction } = useInteractionsStore();
  const { people, fetchPeople } = usePeopleStore();
  
  const moodOptions = [
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'awkward', emoji: '😬', label: 'Awkward' },
  ] as const;
  
  const typeOptions = [
    { value: 'in_person', emoji: '🤝', label: 'In Person' },
    { value: 'call', emoji: '📞', label: 'Call' },
    { value: 'text', emoji: '💬', label: 'Text' },
    { value: 'video', emoji: '📹', label: 'Video' },
  ] as const;
  
  const handleSubmit = async () => {
    if (!selectedPerson) return;
    
    setLoading(true);
    try {
      await addInteraction({
        person_id: selectedPerson.id,
        note,
        mood,
        interaction_type: interactionType,
        occurred_at: new Date().toISOString(),
      });
      
      // Refresh people to update last_contacted_at
      await fetchPeople();
      
      // Reset and close
      setNote('');
      setMood('good');
      setInteractionType('in_person');
      setSelectedPerson(null);
      setStep('person');
      onClose();
    } catch (error) {
      console.error('Failed to log interaction:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setStep('details');
  };
  
  const handleBack = () => {
    setStep('person');
    setSelectedPerson(null);
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
          <Pressable onPress={step === 'details' && !preselectedPerson ? handleBack : onClose}>
            <Text className="text-primary-500 text-base">
              {step === 'details' && !preselectedPerson ? '← Back' : 'Cancel'}
            </Text>
          </Pressable>
          <Text className="text-lg font-semibold">Quick Log</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {step === 'person' ? (
          // Step 1: Select Person
          <ScrollView className="flex-1 p-4">
            <Text className="text-base text-gray-600 mb-4">Who did you interact with?</Text>
            
            {people.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-gray-500">No people added yet</Text>
              </View>
            ) : (
              people.map(person => (
                <Pressable
                  key={person.id}
                  onPress={() => handleSelectPerson(person)}
                  className="flex-row items-center p-4 bg-white rounded-xl mb-2 active:bg-gray-50"
                >
                  <Avatar name={person.name} imageUrl={person.photo_url} size="md" />
                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-gray-900">{person.name}</Text>
                    <Text className="text-sm text-gray-500 capitalize">{person.relationship}</Text>
                  </View>
                  <Text className="text-gray-400">→</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
          // Step 2: Log Details
          <ScrollView className="flex-1 p-4">
            {/* Selected Person */}
            <Card className="mb-4">
              <View className="flex-row items-center">
                <Avatar name={selectedPerson!.name} imageUrl={selectedPerson!.photo_url} size="lg" />
                <View className="ml-3">
                  <Text className="text-lg font-semibold">{selectedPerson!.name}</Text>
                  <Text className="text-sm text-gray-500 capitalize">{selectedPerson!.relationship}</Text>
                </View>
              </View>
            </Card>
            
            {/* Interaction Type */}
            <Text className="text-base font-medium text-gray-700 mb-2">How did you connect?</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {typeOptions.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() => setInteractionType(option.value)}
                  className={`flex-row items-center px-4 py-3 rounded-xl ${
                    interactionType === option.value 
                      ? 'bg-primary-500' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text className="text-xl mr-2">{option.emoji}</Text>
                  <Text className={interactionType === option.value ? 'text-white font-medium' : 'text-gray-700'}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Mood */}
            <Text className="text-base font-medium text-gray-700 mb-2">How did it go?</Text>
            <View className="flex-row gap-3 mb-6">
              {moodOptions.map(option => (
                <Pressable
                  key={option.value}
                  onPress={() => setMood(option.value)}
                  className={`flex-1 items-center py-4 rounded-xl ${
                    mood === option.value 
                      ? 'bg-primary-500' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text className="text-3xl mb-1">{option.emoji}</Text>
                  <Text className={mood === option.value ? 'text-white font-medium' : 'text-gray-700'}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Note */}
            <Input
              label="Quick note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="What did you talk about?"
              multiline
              numberOfLines={3}
            />
            
            {/* Submit */}
            <View className="mt-6">
              <Button
                title="Log Interaction"
                onPress={handleSubmit}
                loading={loading}
                fullWidth
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePeopleStore } from '../../stores/peopleStore';
import { Button, Input, Card } from '../../components/ui';

type Relationship = 'family' | 'friend' | 'work' | 'acquaintance';

export default function NewPersonScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('friend');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [anniversary, setAnniversary] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  const { addPerson, loading } = usePeopleStore();
  
  const relationships: { value: Relationship; label: string; emoji: string }[] = [
    { value: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { value: 'friend', label: 'Friend', emoji: '👫' },
    { value: 'work', label: 'Work', emoji: '💼' },
    { value: 'acquaintance', label: 'Other', emoji: '👋' },
  ];
  
  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validate()) return;
    
    const person = await addPerson({
      name: name.trim(),
      relationship,
      birthday: birthday?.toISOString().split('T')[0],
      anniversary: anniversary?.toISOString().split('T')[0],
      notes,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      photo_url: null,
      last_contacted_at: null,
    });
    
    if (person) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to add person. Please try again.');
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary-500">Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={loading}>
              <Text className={`font-semibold ${loading ? 'text-gray-400' : 'text-primary-500'}`}>
                Save
              </Text>
            </Pressable>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 bg-gray-50"
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-4">
            {/* Basic Info */}
            <Card className="mb-4">
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                autoCapitalize="words"
                error={errors.name}
                testID="name-input"
              />
            </Card>
            
            {/* Relationship */}
            <Card className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">Relationship</Text>
              <View className="flex-row flex-wrap gap-2">
                {relationships.map(r => (
                  <Pressable
                    key={r.value}
                    onPress={() => setRelationship(r.value)}
                    className={`flex-row items-center px-4 py-3 rounded-xl ${
                      relationship === r.value 
                        ? 'bg-primary-500' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className="mr-2">{r.emoji}</Text>
                    <Text className={relationship === r.value ? 'text-white font-medium' : 'text-gray-700'}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
            
            {/* Important Dates */}
            <Card className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">Important Dates</Text>
              
              <Pressable 
                onPress={() => setShowBirthdayPicker(true)}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <Text className="text-xl mr-3">🎂</Text>
                <View className="flex-1">
                  <Text className="text-gray-900">Birthday</Text>
                </View>
                <Text className={birthday ? 'text-gray-900' : 'text-gray-400'}>
                  {birthday ? formatDate(birthday) : 'Not set'}
                </Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setShowAnniversaryPicker(true)}
                className="flex-row items-center py-3"
              >
                <Text className="text-xl mr-3">💕</Text>
                <View className="flex-1">
                  <Text className="text-gray-900">Anniversary</Text>
                </View>
                <Text className={anniversary ? 'text-gray-900' : 'text-gray-400'}>
                  {anniversary ? formatDate(anniversary) : 'Not set'}
                </Text>
              </Pressable>
              
              {/* Date Pickers for web */}
              {Platform.OS === 'web' && showBirthdayPicker && (
                <View className="mt-2">
                  <input
                    type="date"
                    onChange={(e) => {
                      setBirthday(new Date(e.target.value));
                      setShowBirthdayPicker(false);
                    }}
                    className="p-2 border rounded"
                  />
                </View>
              )}
              
              {Platform.OS === 'web' && showAnniversaryPicker && (
                <View className="mt-2">
                  <input
                    type="date"
                    onChange={(e) => {
                      setAnniversary(new Date(e.target.value));
                      setShowAnniversaryPicker(false);
                    }}
                    className="p-2 border rounded"
                  />
                </View>
              )}
            </Card>
            
            {/* Notes */}
            <Card className="mb-4">
              <Input
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Loves hiking, works at Google, has two kids named Max and Lily..."
                multiline
                numberOfLines={4}
              />
              <Text className="text-xs text-gray-400 mt-2">
                🔒 Notes are encrypted before being stored
              </Text>
            </Card>
            
            {/* Tags */}
            <Card className="mb-4">
              <Input
                label="Tags"
                value={tags}
                onChangeText={setTags}
                placeholder="college, hiking, book-club"
              />
              <Text className="text-xs text-gray-400 mt-2">
                Separate tags with commas
              </Text>
            </Card>
            
            {/* Save Button */}
            <Button
              title="Add Person"
              onPress={handleSave}
              loading={loading}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Native Date Pickers */}
      {Platform.OS !== 'web' && showBirthdayPicker && (
        <DateTimePicker
          value={birthday || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowBirthdayPicker(false);
            if (date) setBirthday(date);
          }}
        />
      )}
      
      {Platform.OS !== 'web' && showAnniversaryPicker && (
        <DateTimePicker
          value={anniversary || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowAnniversaryPicker(false);
            if (date) setAnniversary(date);
          }}
        />
      )}
    </>
  );
}

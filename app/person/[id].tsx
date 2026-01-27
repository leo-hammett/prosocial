import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePeopleStore } from '../../stores/peopleStore';
import { useInteractionsStore } from '../../stores/interactionsStore';
import { Avatar, Card, Button, Badge } from '../../components/ui';
import { QuickLogSheet } from '../../components/QuickLogSheet';
import { formatDate, formatBirthday, daysUntilNextOccurrence, formatDaysUntil, formatRelative, getAge } from '../../lib/dates';
import type { Interaction } from '../../lib/types';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [personInteractions, setPersonInteractions] = useState<Interaction[]>([]);
  
  const { getPerson, deletePerson } = usePeopleStore();
  const { fetchForPerson } = useInteractionsStore();
  
  const person = getPerson(id);
  
  useEffect(() => {
    if (id) {
      fetchForPerson(id).then(setPersonInteractions);
    }
  }, [id]);
  
  if (!person) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Person not found</Text>
      </View>
    );
  }
  
  const birthdayDays = person.birthday ? daysUntilNextOccurrence(person.birthday) : null;
  const anniversaryDays = person.anniversary ? daysUntilNextOccurrence(person.anniversary) : null;
  const age = person.birthday ? getAge(person.birthday) : null;
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deletePerson(person.id);
            router.back();
          },
        },
      ]
    );
  };
  
  const moodEmoji = {
    good: '😊',
    okay: '😐',
    awkward: '😬',
  };
  
  const typeEmoji = {
    in_person: '🤝',
    call: '📞',
    text: '💬',
    video: '📹',
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: person.name,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/person/edit/${person.id}`)}>
              <Text className="text-primary-500 font-medium">Edit</Text>
            </Pressable>
          ),
        }}
      />
      
      <ScrollView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-8 items-center border-b border-gray-100">
          <Avatar name={person.name} imageUrl={person.photo_url} size="xl" />
          <Text className="text-2xl font-bold text-gray-900 mt-4">{person.name}</Text>
          
          <View className="flex-row items-center mt-2">
            <Badge 
              label={person.relationship} 
              variant="primary"
              size="md"
            />
            {person.tags.map(tag => (
              <View key={tag} className="ml-2">
                <Badge label={tag} size="md" />
              </View>
            ))}
          </View>
        </View>
        
        <View className="p-4">
          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-6">
            <Pressable 
              onPress={() => setShowQuickLog(true)}
              className="flex-1 bg-primary-500 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">Log Interaction</Text>
            </Pressable>
          </View>
          
          {/* Important Dates */}
          {(person.birthday || person.anniversary) && (
            <Card className="mb-4">
              <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Important Dates
              </Text>
              
              {person.birthday && (
                <View className="flex-row items-center py-2">
                  <Text className="text-2xl mr-3">🎂</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">Birthday</Text>
                    <Text className="text-sm text-gray-500">
                      {formatBirthday(person.birthday)}
                      {age && ` (turns ${age + 1})`}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${birthdayDays! <= 7 ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Text className={birthdayDays! <= 7 ? 'text-primary-700 font-medium' : 'text-gray-600'}>
                      {formatDaysUntil(birthdayDays!)}
                    </Text>
                  </View>
                </View>
              )}
              
              {person.anniversary && (
                <View className="flex-row items-center py-2">
                  <Text className="text-2xl mr-3">💕</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">Anniversary</Text>
                    <Text className="text-sm text-gray-500">{formatDate(person.anniversary)}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${anniversaryDays! <= 7 ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Text className={anniversaryDays! <= 7 ? 'text-primary-700 font-medium' : 'text-gray-600'}>
                      {formatDaysUntil(anniversaryDays!)}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          )}
          
          {/* Notes */}
          {person.notes && (
            <Card className="mb-4">
              <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Notes
              </Text>
              <Text className="text-gray-700 leading-relaxed">{person.notes}</Text>
            </Card>
          )}
          
          {/* Interaction History */}
          <Card className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Recent Interactions
              </Text>
              <Text className="text-sm text-gray-400">
                {personInteractions.length} total
              </Text>
            </View>
            
            {personInteractions.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-gray-400">No interactions logged yet</Text>
                <Pressable 
                  onPress={() => setShowQuickLog(true)}
                  className="mt-2"
                >
                  <Text className="text-primary-500 font-medium">Log your first one</Text>
                </Pressable>
              </View>
            ) : (
              personInteractions.slice(0, 5).map((interaction, index) => (
                <View 
                  key={interaction.id}
                  className={`flex-row items-start py-3 ${
                    index < personInteractions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Text className="text-xl mr-3">
                    {typeEmoji[interaction.interaction_type]}
                  </Text>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-medium text-gray-900 capitalize">
                        {interaction.interaction_type.replace('_', ' ')}
                      </Text>
                      <Text className="ml-2">{moodEmoji[interaction.mood]}</Text>
                    </View>
                    {interaction.note && (
                      <Text className="text-sm text-gray-600 mt-1">{interaction.note}</Text>
                    )}
                    <Text className="text-xs text-gray-400 mt-1">
                      {formatRelative(interaction.occurred_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
          
          {/* Danger Zone */}
          <Card variant="outline" className="border-red-200">
            <Pressable onPress={handleDelete} className="flex-row items-center">
              <FontAwesome name="trash" size={18} color="#ef4444" />
              <Text className="ml-3 text-red-500 font-medium">Delete {person.name}</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
      
      <QuickLogSheet 
        visible={showQuickLog} 
        onClose={() => {
          setShowQuickLog(false);
          // Refresh interactions
          fetchForPerson(id).then(setPersonInteractions);
        }}
        preselectedPerson={person}
      />
    </>
  );
}

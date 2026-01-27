import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import type { Person } from '../lib/types';
import { formatDaysSince, daysSinceContact, daysUntilNextOccurrence, formatDaysUntil } from '../lib/dates';

interface PersonCardProps {
  person: Person;
  showBirthday?: boolean;
  showLastContact?: boolean;
  compact?: boolean;
}

export function PersonCard({ 
  person, 
  showBirthday = true, 
  showLastContact = true,
  compact = false,
}: PersonCardProps) {
  const router = useRouter();
  
  const daysSince = daysSinceContact(person.last_contacted_at);
  const birthdayDays = person.birthday ? daysUntilNextOccurrence(person.birthday) : null;
  
  // Determine if this person needs attention
  const needsAttention = daysSince !== null && daysSince > 30;
  const birthdaySoon = birthdayDays !== null && birthdayDays <= 7;
  
  const relationshipColors = {
    family: 'bg-purple-100 text-purple-700',
    friend: 'bg-blue-100 text-blue-700',
    work: 'bg-gray-100 text-gray-700',
    acquaintance: 'bg-green-100 text-green-700',
  };
  
  if (compact) {
    return (
      <Pressable
        onPress={() => router.push(`/person/${person.id}`)}
        className="flex-row items-center py-3 px-4 bg-white border-b border-gray-100 active:bg-gray-50"
      >
        <Avatar name={person.name} imageUrl={person.photo_url} size="sm" />
        <Text className="ml-3 flex-1 font-medium text-gray-900">{person.name}</Text>
        {birthdaySoon && (
          <View className="bg-primary-100 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-primary-700">🎂 {formatDaysUntil(birthdayDays!)}</Text>
          </View>
        )}
      </Pressable>
    );
  }
  
  return (
    <Pressable
      onPress={() => router.push(`/person/${person.id}`)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm active:opacity-90"
      testID={`person-card-${person.id}`}
    >
      <View className="flex-row items-start">
        <Avatar name={person.name} imageUrl={person.photo_url} size="lg" />
        
        <View className="flex-1 ml-4">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-gray-900 flex-1">
              {person.name}
            </Text>
            {birthdaySoon && (
              <Text className="text-lg">🎂</Text>
            )}
          </View>
          
          <View className="flex-row items-center mt-1 flex-wrap gap-1">
            <View className={`px-2 py-0.5 rounded-full ${relationshipColors[person.relationship]}`}>
              <Text className="text-xs font-medium capitalize">{person.relationship}</Text>
            </View>
            {person.tags.slice(0, 2).map(tag => (
              <Badge key={tag} label={tag} size="sm" />
            ))}
          </View>
          
          {showLastContact && (
            <Text 
              className={`text-sm mt-2 ${needsAttention ? 'text-primary-600 font-medium' : 'text-gray-500'}`}
            >
              {needsAttention ? '⚠️ ' : ''}
              {formatDaysSince(daysSince)}
            </Text>
          )}
          
          {showBirthday && birthdayDays !== null && (
            <Text className={`text-sm mt-1 ${birthdaySoon ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              🎂 Birthday {formatDaysUntil(birthdayDays)}
            </Text>
          )}
          
          {person.notes && (
            <Text className="text-sm text-gray-600 mt-2 line-clamp-2" numberOfLines={2}>
              {person.notes}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

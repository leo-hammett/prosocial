import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import type { TodayItem } from '../lib/types';
import { formatDaysUntil, formatDaysSince } from '../lib/dates';

interface TodayCardProps {
  item: TodayItem;
}

export function TodayCard({ item }: TodayCardProps) {
  const router = useRouter();
  
  const configs = {
    birthday: {
      emoji: '🎂',
      title: 'Birthday',
      color: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-700',
    },
    anniversary: {
      emoji: '💕',
      title: 'Anniversary',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
    },
    nudge: {
      emoji: '👋',
      title: 'Reconnect',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    meeting: {
      emoji: '📅',
      title: 'Meeting Today',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
  };
  
  const config = configs[item.type];
  
  const getSubtitle = () => {
    switch (item.type) {
      case 'birthday':
      case 'anniversary':
        return item.days_until === 0 
          ? 'Today!' 
          : formatDaysUntil(item.days_until!);
      case 'nudge':
        return `Last contact: ${formatDaysSince(item.days_since!)}`;
      case 'meeting':
        return item.meeting_time || 'Today';
    }
  };
  
  return (
    <Pressable
      onPress={() => router.push(`/person/${item.person.id}`)}
      className="mb-3"
    >
      <Card variant="outline" className={`${config.color} border`}>
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">{config.emoji}</Text>
          <Avatar name={item.person.name} imageUrl={item.person.photo_url} size="md" />
          
          <View className="flex-1 ml-3">
            <Text className={`text-sm font-medium ${config.textColor}`}>
              {config.title}
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {item.person.name}
            </Text>
            <Text className="text-sm text-gray-600">
              {getSubtitle()}
            </Text>
          </View>
          
          <View className="bg-white rounded-full p-2">
            <Text>→</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

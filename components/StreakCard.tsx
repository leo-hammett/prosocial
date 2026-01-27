import { View, Text } from 'react-native';
import { Card } from './ui/Card';
import { getStreakEmoji } from '../lib/streaks';

interface StreakCardProps {
  type: 'contact' | 'checkin' | 'remember';
  current: number;
  longest: number;
  message: string;
  atRisk?: boolean;
}

export function StreakCard({ type, current, longest, message, atRisk = false }: StreakCardProps) {
  const titles = {
    contact: 'Daily Contact',
    checkin: 'Weekly Check-in',
    remember: 'Dates Remembered',
  };
  
  const descriptions = {
    contact: 'Days in a row you logged seeing someone',
    checkin: 'Weeks you reached out to close friends',
    remember: 'Birthdays & anniversaries you celebrated',
  };
  
  const emoji = getStreakEmoji(current);
  
  return (
    <Card variant="elevated" className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-3xl mr-2">{emoji}</Text>
          <View>
            <Text className="text-lg font-semibold text-gray-900">{titles[type]}</Text>
            <Text className="text-xs text-gray-500">{descriptions[type]}</Text>
          </View>
        </View>
        
        <View className="items-end">
          <Text className="text-3xl font-bold text-primary-500">{current}</Text>
          <Text className="text-xs text-gray-400">Best: {longest}</Text>
        </View>
      </View>
      
      <View className={`rounded-xl p-3 ${atRisk ? 'bg-yellow-50' : 'bg-streak-50'}`}>
        <Text className={`text-sm ${atRisk ? 'text-yellow-700' : 'text-streak-700'}`}>
          {atRisk ? '⏰ Log an interaction today to keep your streak!' : message}
        </Text>
      </View>
    </Card>
  );
}

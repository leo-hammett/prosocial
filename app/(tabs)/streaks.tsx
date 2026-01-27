import { View, Text, ScrollView, RefreshControl, Pressable, Share } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { usePeopleStore } from '../../stores/peopleStore';
import { useInteractionsStore } from '../../stores/interactionsStore';
import { useStreaksStore } from '../../stores/streaksStore';
import { useAuthStore } from '../../stores/authStore';
import { StreakCard } from '../../components/StreakCard';
import { Card, EmptyState, Button } from '../../components/ui';

export default function StreaksScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuthStore();
  const { people, fetchPeople } = usePeopleStore();
  const { interactions, fetchInteractions } = useInteractionsStore();
  const { 
    streaks, 
    calculateStreaks, 
    atRisk,
    getContactStreakMessage,
    getCheckinStreakMessage,
    getRememberStreakMessage,
  } = useStreaksStore();
  
  useEffect(() => {
    if (user) {
      fetchPeople();
      fetchInteractions();
    }
  }, [user]);
  
  useEffect(() => {
    if (interactions.length > 0) {
      const importantPersonIds = people
        .filter(p => p.relationship === 'family' || p.relationship === 'friend')
        .map(p => p.id);
      calculateStreaks(interactions, importantPersonIds);
    }
  }, [interactions, people]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPeople(), fetchInteractions()]);
    setRefreshing(false);
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I've been intentionally investing in my friendships for ${streaks.contact.current} days straight with Prosocial! 🔥`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  if (!user) {
    return (
      <EmptyState
        icon="🔥"
        title="Sign in to track streaks"
        description="Build habits of staying connected with the people who matter."
        actionLabel="Sign In"
        onAction={() => router.push('/(auth)/login')}
      />
    );
  }
  
  const totalStreak = streaks.contact.current + streaks.checkin.current + streaks.remember.current;
  
  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View className="p-4">
        {/* Summary Header */}
        <Card variant="elevated" className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600">
          <View className="items-center py-4">
            <Text className="text-5xl mb-2">
              {totalStreak > 50 ? '🏆' : totalStreak > 20 ? '⭐' : totalStreak > 7 ? '🔥' : '🌱'}
            </Text>
            <Text className="text-white text-opacity-80 text-sm">Total Streak Points</Text>
            <Text className="text-white text-4xl font-bold">{totalStreak}</Text>
            
            {streaks.contact.current >= 7 && (
              <Pressable 
                onPress={handleShare}
                className="mt-4 bg-white bg-opacity-20 px-4 py-2 rounded-full"
              >
                <Text className="text-white font-medium">Share Your Streak</Text>
              </Pressable>
            )}
          </View>
        </Card>
        
        {/* Individual Streaks */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">Your Streaks</Text>
        
        <StreakCard
          type="contact"
          current={streaks.contact.current}
          longest={streaks.contact.longest}
          message={getContactStreakMessage()}
          atRisk={atRisk}
        />
        
        <StreakCard
          type="checkin"
          current={streaks.checkin.current}
          longest={streaks.checkin.longest}
          message={getCheckinStreakMessage()}
        />
        
        <StreakCard
          type="remember"
          current={streaks.remember.current}
          longest={streaks.remember.longest}
          message={getRememberStreakMessage()}
        />
        
        {/* Tips */}
        <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">Tips</Text>
        
        <Card variant="outline" className="mb-3">
          <View className="flex-row items-start">
            <Text className="text-xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Daily Contact Streak</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Log any interaction - a text, call, or coffee chat - to keep your streak going.
              </Text>
            </View>
          </View>
        </Card>
        
        <Card variant="outline" className="mb-3">
          <View className="flex-row items-start">
            <Text className="text-xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Weekly Check-in Streak</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Reach out to at least one family member or close friend each week.
              </Text>
            </View>
          </View>
        </Card>
        
        <Card variant="outline">
          <View className="flex-row items-start">
            <Text className="text-xl mr-3">💡</Text>
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Remember Streak</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Log an interaction on someone's birthday or anniversary to mark it as remembered.
              </Text>
            </View>
          </View>
        </Card>
        
        {/* CTA */}
        {interactions.length === 0 && (
          <View className="mt-6">
            <Button
              title="Log Your First Interaction"
              onPress={() => router.push('/log')}
              fullWidth
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

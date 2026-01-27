import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { usePeopleStore } from '../../stores/peopleStore';
import { useInteractionsStore } from '../../stores/interactionsStore';
import { useStreaksStore } from '../../stores/streaksStore';
import { useAuthStore } from '../../stores/authStore';
import { TodayCard } from '../../components/TodayCard';
import { Card, EmptyState, Button } from '../../components/ui';
import { QuickLogSheet } from '../../components/QuickLogSheet';
import { TodayScreenSkeleton } from '../../components/LoadingSkeleton';
import type { TodayItem } from '../../lib/types';
import { daysUntilNextOccurrence, daysSinceContact, needsNudge } from '../../lib/dates';
import { getStreakEmoji } from '../../lib/streaks';

export default function TodayScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  
  const { user } = useAuthStore();
  const { people, fetchPeople, loading: peopleLoading } = usePeopleStore();
  const { interactions, fetchInteractions, loading: interactionsLoading } = useInteractionsStore();
  const { streaks, calculateStreaks, atRisk } = useStreaksStore();
  
  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchPeople();
      fetchInteractions();
    }
  }, [user]);
  
  // Calculate streaks when interactions change
  useEffect(() => {
    if (interactions.length > 0) {
      const importantPersonIds = people
        .filter(p => p.relationship === 'family' || p.relationship === 'friend')
        .map(p => p.id);
      calculateStreaks(interactions, importantPersonIds);
    }
  }, [interactions, people]);
  
  // Build today items
  const todayItems = useMemo<TodayItem[]>(() => {
    const items: TodayItem[] = [];
    
    for (const person of people) {
      // Check birthday
      if (person.birthday) {
        const daysUntil = daysUntilNextOccurrence(person.birthday);
        if (daysUntil <= 7) {
          items.push({
            type: 'birthday',
            person,
            days_until: daysUntil,
          });
        }
      }
      
      // Check anniversary
      if (person.anniversary) {
        const daysUntil = daysUntilNextOccurrence(person.anniversary);
        if (daysUntil <= 7) {
          items.push({
            type: 'anniversary',
            person,
            days_until: daysUntil,
          });
        }
      }
      
      // Check if needs nudge (important people only)
      if (person.relationship === 'family' || person.relationship === 'friend') {
        if (needsNudge(person.last_contacted_at, 30)) {
          const daysSince = daysSinceContact(person.last_contacted_at);
          items.push({
            type: 'nudge',
            person,
            days_since: daysSince ?? 999,
          });
        }
      }
    }
    
    // Sort: today first, then by urgency
    return items.sort((a, b) => {
      // Birthdays/anniversaries today first
      if ((a.days_until === 0) !== (b.days_until === 0)) {
        return a.days_until === 0 ? -1 : 1;
      }
      // Then by days until (for dates) or days since (for nudges)
      const aUrgency = a.days_until ?? a.days_since ?? 0;
      const bUrgency = b.days_until ?? b.days_since ?? 0;
      return aUrgency - bUrgency;
    });
  }, [people]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPeople(), fetchInteractions()]);
    setRefreshing(false);
  };
  
  // If not logged in, show auth prompt
  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-4xl mb-4">👋</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Welcome to Prosocial
        </Text>
        <Text className="text-base text-gray-600 text-center mb-6">
          Be the friend you want to have
        </Text>
        <Button
          title="Get Started"
          onPress={() => router.push('/(auth)/login')}
          size="lg"
        />
      </View>
    );
  }
  
  const loading = peopleLoading || interactionsLoading;
  
  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View className="p-4">
        {/* Streak Summary */}
        <Card variant="elevated" className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500">Your Streaks</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-2xl mr-2">
                  {getStreakEmoji(streaks.contact.current)}
                </Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {streaks.contact.current}
                </Text>
                <Text className="text-base text-gray-500 ml-1">day streak</Text>
              </View>
            </View>
            
            <Pressable 
              onPress={() => router.push('/streaks')}
              className="bg-streak-100 px-3 py-2 rounded-xl"
            >
              <Text className="text-streak-700 font-medium">View All</Text>
            </Pressable>
          </View>
          
          {atRisk && (
            <View className="mt-3 bg-yellow-50 rounded-xl p-3">
              <Text className="text-yellow-700 text-sm">
                ⏰ Log an interaction today to keep your streak going!
              </Text>
            </View>
          )}
        </Card>
        
        {/* Today Items */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">Today</Text>
          <Pressable onPress={() => setShowQuickLog(true)}>
            <Text className="text-primary-500 font-medium">+ Quick Log</Text>
          </Pressable>
        </View>
        
        {loading && todayItems.length === 0 && people.length === 0 ? (
          <TodayScreenSkeleton />
        ) : todayItems.length === 0 ? (
          <Card variant="outline" className="border-dashed">
            <View className="items-center py-6">
              <Text className="text-4xl mb-3">✨</Text>
              <Text className="text-base font-medium text-gray-900">All caught up!</Text>
              <Text className="text-sm text-gray-500 text-center mt-1">
                No birthdays, anniversaries, or check-ins due today.
              </Text>
            </View>
          </Card>
        ) : (
          todayItems.map((item, index) => (
            <TodayCard key={`${item.type}-${item.person.id}-${index}`} item={item} />
          ))
        )}
        
        {/* Quick Actions */}
        {people.length === 0 && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Get Started</Text>
            <Card variant="outline">
              <Pressable 
                onPress={() => router.push('/person/new')}
                className="flex-row items-center py-2"
              >
                <Text className="text-2xl mr-3">👤</Text>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Add your first person</Text>
                  <Text className="text-sm text-gray-500">Start tracking relationships</Text>
                </View>
                <Text className="text-gray-400">→</Text>
              </Pressable>
            </Card>
          </View>
        )}
      </View>
      
      <QuickLogSheet 
        visible={showQuickLog} 
        onClose={() => setShowQuickLog(false)} 
      />
    </ScrollView>
  );
}

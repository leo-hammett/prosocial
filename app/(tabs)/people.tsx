import { View, Text, ScrollView, RefreshControl, TextInput, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePeopleStore } from '../../stores/peopleStore';
import { useAuthStore } from '../../stores/authStore';
import { PersonCard } from '../../components/PersonCard';
import { ImportSheet } from '../../components/ImportSheet';
import { EmptyState, Button, Card } from '../../components/ui';
import { PeopleListSkeleton } from '../../components/LoadingSkeleton';

type FilterType = 'all' | 'family' | 'friend' | 'work' | 'acquaintance';

export default function PeopleScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showImport, setShowImport] = useState(false);
  
  const { user } = useAuthStore();
  const { people, fetchPeople, loading, searchPeople } = usePeopleStore();
  
  useEffect(() => {
    if (user) {
      fetchPeople();
    }
  }, [user]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPeople();
    setRefreshing(false);
  };
  
  // Filter and search
  const filteredPeople = (searchQuery ? searchPeople(searchQuery) : people)
    .filter(p => filter === 'all' || p.relationship === filter);
  
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'family', label: 'Family' },
    { value: 'friend', label: 'Friends' },
    { value: 'work', label: 'Work' },
    { value: 'acquaintance', label: 'Other' },
  ];
  
  if (!user) {
    return (
      <EmptyState
        icon="👤"
        title="Sign in to see your people"
        description="Your contacts are private and encrypted."
        actionLabel="Sign In"
        onAction={() => router.push('/(auth)/login')}
      />
    );
  }
  
  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <FontAwesome name="search" size={16} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search people..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-base text-gray-900"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>
        
        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-3"
        >
          {filters.map(f => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full mr-2 ${
                filter === f.value 
                  ? 'bg-primary-500' 
                  : 'bg-gray-100'
              }`}
            >
              <Text className={filter === f.value ? 'text-white font-medium' : 'text-gray-700'}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
      >
        {loading && people.length === 0 ? (
          <PeopleListSkeleton />
        ) : filteredPeople.length === 0 ? (
          searchQuery ? (
            <View className="items-center py-8">
              <Text className="text-gray-500">No results for "{searchQuery}"</Text>
            </View>
          ) : people.length === 0 ? (
            <View>
              <EmptyState
                icon="👥"
                title="No people yet"
                description="Add friends, family, and colleagues to start tracking your relationships."
                actionLabel="Add Person"
                onAction={() => router.push('/person/new')}
              />
              
              <View className="mt-4">
                <Card variant="outline">
                  <Pressable 
                    onPress={() => setShowImport(true)}
                    className="flex-row items-center"
                  >
                    <Text className="text-2xl mr-3">📥</Text>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">Import from apps</Text>
                      <Text className="text-sm text-gray-500">
                        WhatsApp, Discord, Email
                      </Text>
                    </View>
                    <Text className="text-gray-400">→</Text>
                  </Pressable>
                </Card>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <Text className="text-gray-500">No {filter} contacts</Text>
            </View>
          )
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-500">
                {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'}
              </Text>
              <Pressable onPress={() => setShowImport(true)}>
                <Text className="text-primary-500 text-sm font-medium">Import</Text>
              </Pressable>
            </View>
            
            {filteredPeople.map(person => (
              <PersonCard key={person.id} person={person} />
            ))}
          </>
        )}
      </ScrollView>
      
      <ImportSheet visible={showImport} onClose={() => setShowImport(false)} />
    </View>
  );
}

// Offline Support for Prosocial
// Uses AsyncStorage to cache data and queue mutations

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';
import type { Person, Interaction } from './types';

const STORAGE_KEYS = {
  PEOPLE_CACHE: 'prosocial_people_cache',
  INTERACTIONS_CACHE: 'prosocial_interactions_cache',
  PENDING_MUTATIONS: 'prosocial_pending_mutations',
  LAST_SYNC: 'prosocial_last_sync',
};

interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'people' | 'interactions';
  data: any;
  createdAt: string;
}

// Check if device is online
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable === true;
}

// Subscribe to network state changes
export function subscribeToNetworkChanges(
  callback: (isOnline: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const online = state.isConnected === true && state.isInternetReachable === true;
    callback(online);
  });
  
  return unsubscribe;
}

// Cache people data locally
export async function cachePeople(people: Person[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PEOPLE_CACHE,
      JSON.stringify(people)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('Failed to cache people:', error);
  }
}

// Get cached people data
export async function getCachedPeople(): Promise<Person[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.PEOPLE_CACHE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached people:', error);
    return [];
  }
}

// Cache interactions data locally
export async function cacheInteractions(interactions: Interaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.INTERACTIONS_CACHE,
      JSON.stringify(interactions)
    );
  } catch (error) {
    console.error('Failed to cache interactions:', error);
  }
}

// Get cached interactions data
export async function getCachedInteractions(): Promise<Interaction[]> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.INTERACTIONS_CACHE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to get cached interactions:', error);
    return [];
  }
}

// Queue a mutation for when device comes back online
export async function queueMutation(mutation: Omit<PendingMutation, 'id' | 'createdAt'>): Promise<void> {
  try {
    const pending = await getPendingMutations();
    
    const newMutation: PendingMutation = {
      ...mutation,
      id: `mutation_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    
    pending.push(newMutation);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.PENDING_MUTATIONS,
      JSON.stringify(pending)
    );
  } catch (error) {
    console.error('Failed to queue mutation:', error);
    throw error;
  }
}

// Get pending mutations
export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_MUTATIONS);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Failed to get pending mutations:', error);
    return [];
  }
}

// Process pending mutations when back online
export async function processPendingMutations(): Promise<{
  processed: number;
  failed: number;
}> {
  const pending = await getPendingMutations();
  
  if (pending.length === 0) {
    return { processed: 0, failed: 0 };
  }
  
  let processed = 0;
  let failed = 0;
  const remaining: PendingMutation[] = [];
  
  for (const mutation of pending) {
    try {
      let success = false;
      
      switch (mutation.type) {
        case 'create':
          const { error: createError } = await supabase
            .from(mutation.table)
            .insert(mutation.data);
          success = !createError;
          break;
          
        case 'update':
          const { error: updateError } = await supabase
            .from(mutation.table)
            .update(mutation.data.updates)
            .eq('id', mutation.data.id);
          success = !updateError;
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from(mutation.table)
            .delete()
            .eq('id', mutation.data.id);
          success = !deleteError;
          break;
      }
      
      if (success) {
        processed++;
      } else {
        failed++;
        remaining.push(mutation);
      }
    } catch (error) {
      console.error('Failed to process mutation:', error);
      failed++;
      remaining.push(mutation);
    }
  }
  
  // Update pending mutations list
  await AsyncStorage.setItem(
    STORAGE_KEYS.PENDING_MUTATIONS,
    JSON.stringify(remaining)
  );
  
  return { processed, failed };
}

// Get last sync time
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return lastSync ? new Date(lastSync) : null;
  } catch {
    return null;
  }
}

// Clear all cached data
export async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PEOPLE_CACHE,
      STORAGE_KEYS.INTERACTIONS_CACHE,
      STORAGE_KEYS.PENDING_MUTATIONS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Check if there are pending changes to sync
export async function hasPendingChanges(): Promise<boolean> {
  const pending = await getPendingMutations();
  return pending.length > 0;
}

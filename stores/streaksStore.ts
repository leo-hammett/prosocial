import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { calculateContactStreak, calculateCheckinStreak, getStreakMessage, getStreakEmoji, isStreakAtRisk } from '../lib/streaks';
import type { Streak, Interaction, Person } from '../lib/types';

interface StreaksState {
  streaks: {
    contact: { current: number; longest: number };
    checkin: { current: number; longest: number };
    remember: { current: number; longest: number };
  };
  loading: boolean;
  atRisk: boolean;
  
  // Actions
  calculateStreaks: (interactions: Interaction[], importantPersonIds: string[]) => void;
  saveStreaks: () => Promise<void>;
  getContactStreakMessage: () => string;
  getCheckinStreakMessage: () => string;
  getRememberStreakMessage: () => string;
}

export const useStreaksStore = create<StreaksState>((set, get) => ({
  streaks: {
    contact: { current: 0, longest: 0 },
    checkin: { current: 0, longest: 0 },
    remember: { current: 0, longest: 0 },
  },
  loading: false,
  atRisk: false,
  
  calculateStreaks: (interactions, importantPersonIds) => {
    const contactStreak = calculateContactStreak(interactions);
    const checkinStreak = calculateCheckinStreak(interactions, importantPersonIds);
    
    // Check if at risk (no interaction today, had one yesterday)
    const lastInteraction = interactions[0];
    const atRisk = lastInteraction 
      ? isStreakAtRisk(lastInteraction.occurred_at)
      : false;
    
    set(state => ({
      streaks: {
        contact: {
          current: contactStreak,
          longest: Math.max(contactStreak, state.streaks.contact.longest),
        },
        checkin: {
          current: checkinStreak,
          longest: Math.max(checkinStreak, state.streaks.checkin.longest),
        },
        remember: state.streaks.remember, // Calculated separately
      },
      atRisk,
    }));
  },
  
  saveStreaks: async () => {
    const { streaks } = get();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Upsert each streak type
      for (const [type, values] of Object.entries(streaks)) {
        await supabase
          .from('streaks')
          .upsert({
            user_id: user.id,
            streak_type: type,
            current_count: values.current,
            longest_count: values.longest,
            last_updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,streak_type',
          });
      }
    } catch (error) {
      console.error('Failed to save streaks:', error);
    }
  },
  
  getContactStreakMessage: () => {
    const { contact } = get().streaks;
    return getStreakMessage('contact', contact.current);
  },
  
  getCheckinStreakMessage: () => {
    const { checkin } = get().streaks;
    return getStreakMessage('checkin', checkin.current);
  },
  
  getRememberStreakMessage: () => {
    const { remember } = get().streaks;
    return getStreakMessage('remember', remember.current);
  },
}));

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { encryptNote, decryptNote } from '../lib/crypto';
import type { Interaction } from '../lib/types';

interface InteractionsState {
  interactions: Interaction[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchInteractions: () => Promise<void>;
  fetchForPerson: (personId: string) => Promise<Interaction[]>;
  addInteraction: (interaction: Omit<Interaction, 'id' | 'user_id' | 'created_at'>) => Promise<Interaction | null>;
  deleteInteraction: (id: string) => Promise<boolean>;
  getRecentInteractions: (limit?: number) => Interaction[];
}

export const useInteractionsStore = create<InteractionsState>((set, get) => ({
  interactions: [],
  loading: false,
  error: null,
  
  fetchInteractions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*, person:people(*)')
        .order('occurred_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Decrypt notes
      const decrypted = await Promise.all(
        (data || []).map(async (interaction) => ({
          ...interaction,
          note: interaction.note_encrypted 
            ? await decryptNote(interaction.note_encrypted)
            : '',
        }))
      );
      
      set({ interactions: decrypted, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchForPerson: async (personId) => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('person_id', personId)
        .order('occurred_at', { ascending: false });
      
      if (error) throw error;
      
      return await Promise.all(
        (data || []).map(async (interaction) => ({
          ...interaction,
          note: interaction.note_encrypted 
            ? await decryptNote(interaction.note_encrypted)
            : '',
        }))
      );
    } catch (error: any) {
      console.error('Error fetching interactions for person:', error);
      return [];
    }
  },
  
  addInteraction: async (interactionData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Encrypt note
      const noteEncrypted = interactionData.note
        ? await encryptNote(interactionData.note)
        : null;
      
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          ...interactionData,
          user_id: user.id,
          note: null,
          note_encrypted: noteEncrypted,
        })
        .select('*, person:people(*)')
        .single();
      
      if (error) throw error;
      
      // Also update the person's last_contacted_at
      await supabase
        .from('people')
        .update({ last_contacted_at: interactionData.occurred_at })
        .eq('id', interactionData.person_id);
      
      const newInteraction: Interaction = {
        ...data,
        note: interactionData.note || '',
      };
      
      set(state => ({
        interactions: [newInteraction, ...state.interactions],
        loading: false,
      }));
      
      return newInteraction;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  deleteInteraction: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        interactions: state.interactions.filter(i => i.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  getRecentInteractions: (limit = 10) => {
    return get().interactions.slice(0, limit);
  },
}));

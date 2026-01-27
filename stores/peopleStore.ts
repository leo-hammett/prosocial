import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { encryptNote, decryptNote } from '../lib/crypto';
import type { Person } from '../lib/types';
import { useAuthStore } from './authStore';

// Demo data for testing
const DEMO_PEOPLE: Person[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user-123',
    name: 'Sarah Chen',
    relationship: 'friend',
    birthday: '1992-02-15',
    notes: 'Met at the React conference. Loves hiking and photography. Works at Stripe.',
    tags: ['tech', 'hiking'],
    last_contacted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'demo-user-123',
    name: 'Mom',
    relationship: 'family',
    birthday: '1965-06-20',
    notes: 'Call every Sunday. Likes updates about work. Ask about her garden.',
    tags: [],
    last_contacted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'demo-user-123',
    name: 'James Wilson',
    relationship: 'work',
    notes: 'Product manager on the growth team. Has a dog named Max.',
    tags: ['work', 'product'],
    last_contacted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    user_id: 'demo-user-123',
    name: 'Alex Rivera',
    relationship: 'friend',
    birthday: '1990-01-30', // Birthday coming up!
    anniversary: '2020-03-14',
    notes: 'College roommate. Getting married next year. Loves board games.',
    tags: ['college', 'games'],
    last_contacted_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface PeopleState {
  people: Person[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPeople: () => Promise<void>;
  addPerson: (person: Omit<Person, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Person | null>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<boolean>;
  deletePerson: (id: string) => Promise<boolean>;
  getPerson: (id: string) => Person | undefined;
  searchPeople: (query: string) => Person[];
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  loading: false,
  error: null,
  
  fetchPeople: async () => {
    set({ loading: true, error: null });
    
    // Check if in demo mode
    const { isDemo } = useAuthStore.getState();
    if (isDemo) {
      set({ people: DEMO_PEOPLE, loading: false });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Decrypt notes for each person
      const decryptedPeople = await Promise.all(
        (data || []).map(async (person) => ({
          ...person,
          notes: person.notes_encrypted 
            ? await decryptNote(person.notes_encrypted)
            : '',
        }))
      );
      
      set({ people: decryptedPeople, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  addPerson: async (personData) => {
    set({ loading: true, error: null });
    
    // Check if in demo mode
    const { isDemo, user } = useAuthStore.getState();
    
    if (isDemo) {
      const newPerson: Person = {
        ...personData,
        id: `demo-${Date.now()}`,
        user_id: 'demo-user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: personData.notes || '',
        tags: personData.tags || [],
      } as Person;
      
      set(state => ({ 
        people: [...state.people, newPerson].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      }));
      
      return newPerson;
    }
    
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');
      
      // Encrypt notes before saving
      const notesEncrypted = personData.notes 
        ? await encryptNote(personData.notes)
        : null;
      
      const { data, error } = await supabase
        .from('people')
        .insert({
          ...personData,
          user_id: authUser.id,
          notes: null, // Don't store plaintext
          notes_encrypted: notesEncrypted,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add to local state with decrypted notes
      const newPerson: Person = {
        ...data,
        notes: personData.notes || '',
      };
      
      set(state => ({ 
        people: [...state.people, newPerson].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      }));
      
      return newPerson;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  updatePerson: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      // If updating notes, encrypt them
      const dbUpdates: any = { ...updates };
      if (updates.notes !== undefined) {
        dbUpdates.notes_encrypted = updates.notes 
          ? await encryptNote(updates.notes)
          : null;
        delete dbUpdates.notes;
      }
      
      const { error } = await supabase
        .from('people')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        people: state.people.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ),
        loading: false,
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  deletePerson: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        people: state.people.filter(p => p.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  getPerson: (id) => {
    return get().people.find(p => p.id === id);
  },
  
  searchPeople: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().people.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.notes?.toLowerCase().includes(lowerQuery)
    );
  },
}));

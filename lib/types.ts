// All the types for Prosocial
// Grug brain says: keep types simple, add fields when you need them

export interface Person {
  id: string;
  user_id: string;
  name: string;
  photo_url?: string;
  birthday?: string; // ISO date string
  anniversary?: string; // ISO date string
  relationship: 'family' | 'friend' | 'work' | 'acquaintance';
  notes?: string; // This gets encrypted before storage
  notes_encrypted?: string; // The encrypted version stored in DB
  tags: string[];
  last_contacted_at?: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  user_id: string;
  person_id: string;
  person?: Person; // Joined from people table
  note?: string; // Encrypted before storage
  note_encrypted?: string;
  mood: 'good' | 'okay' | 'awkward';
  interaction_type: 'in_person' | 'call' | 'text' | 'video';
  occurred_at: string;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  user_id: string;
  person_id?: string;
  person?: Person;
  title: string;
  date: string; // ISO date
  recurring: boolean;
  remind_days_before: number[];
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'contact' | 'checkin' | 'remember';
  current_count: number;
  longest_count: number;
  last_updated_at: string;
}

export interface CoachingTip {
  id: string;
  type: 'pre_meeting' | 'awkwardness' | 'general' | 'pattern';
  title: string;
  content: string;
  person_id?: string;
  person?: Person;
  created_at: string;
}

// For data imports
export interface ImportedContact {
  name: string;
  phone?: string;
  email?: string;
  last_message_date?: string;
  message_count?: number;
  source: 'whatsapp' | 'discord' | 'email';
}

export interface ParsedWhatsAppChat {
  contact_name: string;
  messages: {
    date: string;
    sender: string;
    content: string;
  }[];
}

// User preferences
export interface UserPreferences {
  notifications_enabled: boolean;
  reminder_time: string; // e.g., "09:00"
  streak_reminder: boolean;
  theme: 'light' | 'dark' | 'system';
}

// For the Today screen
export interface TodayItem {
  type: 'birthday' | 'anniversary' | 'nudge' | 'meeting';
  person: Person;
  days_until?: number; // For birthdays/anniversaries
  days_since?: number; // For nudges (haven't contacted in X days)
  meeting_time?: string; // For calendar meetings
}

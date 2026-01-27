// Google Calendar Integration for Prosocial
// Syncs calendar events to show who you're meeting

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from './supabase';
import type { Person } from './types';

// Enable web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Google Calendar API base URL
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus: string;
  }[];
  location?: string;
  description?: string;
}

export interface MeetingWithPerson {
  event: CalendarEvent;
  person: Person | null;
  meetingTime: string;
}

// Get Google OAuth config
function getGoogleConfig() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.warn('Google Client ID not configured');
    return null;
  }

  return {
    clientId,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ],
  };
}

// Hook for Google Calendar auth
export function useGoogleCalendarAuth() {
  const config = getGoogleConfig();
  
  if (!config) {
    return {
      signIn: async () => ({ error: new Error('Google Calendar not configured') }),
      isConfigured: false,
    };
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: config.clientId,
    scopes: config.scopes,
  });

  const signIn = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type === 'success' && result.authentication) {
        // Save token to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              google_calendar_token: result.authentication.accessToken,
            }, {
              onConflict: 'user_id',
            });
        }
        
        return { 
          error: null, 
          accessToken: result.authentication.accessToken,
        };
      }
      
      return { error: new Error('Authentication cancelled') };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    signIn,
    isConfigured: true,
    isReady: !!request,
  };
}

// Fetch today's calendar events
export async function fetchTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const params = new URLSearchParams({
    timeMin: today.toISOString(),
    timeMax: tomorrow.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return [];
  }
}

// Fetch upcoming events (next 7 days)
export async function fetchUpcomingEvents(
  accessToken: string,
  days: number = 7
): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  try {
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return [];
  }
}

// Match calendar events with people in your contacts
export function matchEventsWithPeople(
  events: CalendarEvent[],
  people: Person[]
): MeetingWithPerson[] {
  return events.map(event => {
    // Try to match attendees with people
    let matchedPerson: Person | null = null;
    
    if (event.attendees) {
      for (const attendee of event.attendees) {
        // Skip self (usually the organizer with responseStatus: 'accepted')
        if (attendee.responseStatus === 'organizer') continue;
        
        // Try to match by name
        const name = attendee.displayName || attendee.email.split('@')[0];
        const person = people.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(p.name.toLowerCase()) ||
          p.notes?.toLowerCase().includes(attendee.email.toLowerCase())
        );
        
        if (person) {
          matchedPerson = person;
          break;
        }
      }
    }
    
    // If no attendee match, try to match event title with person names
    if (!matchedPerson) {
      matchedPerson = people.find(p => 
        event.summary?.toLowerCase().includes(p.name.toLowerCase())
      ) || null;
    }
    
    // Format meeting time
    const startTime = event.start.dateTime || event.start.date;
    const meetingTime = startTime 
      ? new Date(startTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true,
        })
      : 'All day';
    
    return {
      event,
      person: matchedPerson,
      meetingTime,
    };
  });
}

// Extract person info from calendar event for import
export function extractPersonFromEvent(event: CalendarEvent): {
  name: string;
  email?: string;
} | null {
  if (!event.attendees || event.attendees.length === 0) {
    return null;
  }
  
  // Get the first non-organizer attendee
  const attendee = event.attendees.find(a => a.responseStatus !== 'organizer');
  
  if (!attendee) {
    return null;
  }
  
  return {
    name: attendee.displayName || attendee.email.split('@')[0],
    email: attendee.email,
  };
}

// Get calendar connection status
export async function getCalendarStatus(): Promise<{
  connected: boolean;
  hasValidToken: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { connected: false, hasValidToken: false };
    }
    
    const { data } = await supabase
      .from('user_preferences')
      .select('google_calendar_token')
      .eq('user_id', user.id)
      .single();
    
    if (!data?.google_calendar_token) {
      return { connected: false, hasValidToken: false };
    }
    
    // Test the token
    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary`,
      {
        headers: {
          Authorization: `Bearer ${data.google_calendar_token}`,
        },
      }
    );
    
    return {
      connected: true,
      hasValidToken: response.ok,
    };
  } catch {
    return { connected: false, hasValidToken: false };
  }
}

// Disconnect calendar
export async function disconnectCalendar(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase
    .from('user_preferences')
    .update({ google_calendar_token: null })
    .eq('user_id', user.id);
}

// Push Notification Setup for Prosocial
// Uses Expo Notifications for cross-platform push

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { Person } from './types';
import { daysUntilNextOccurrence } from './dates';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications and get token
export async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Save token to user preferences in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          expo_push_token: token.data,
        }, {
          onConflict: 'user_id',
        });
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e05c4f',
      });

      await Notifications.setNotificationChannelAsync('birthdays', {
        name: 'Birthdays & Anniversaries',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e05c4f',
      });

      await Notifications.setNotificationChannelAsync('streaks', {
        name: 'Streak Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Schedule a local notification for a birthday
export async function scheduleBirthdayNotification(
  person: Person,
  daysBefor: number
): Promise<string | null> {
  if (!person.birthday) return null;

  const daysUntil = daysUntilNextOccurrence(person.birthday);
  
  // Calculate trigger date
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + daysUntil - daysBefor);
  triggerDate.setHours(9, 0, 0, 0); // 9 AM

  // Don't schedule if in the past
  if (triggerDate <= new Date()) return null;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: daysBefor === 0 
        ? `🎂 It's ${person.name}'s birthday!` 
        : `🎂 ${person.name}'s birthday in ${daysBefor} day${daysBefor > 1 ? 's' : ''}`,
      body: daysBefor === 0
        ? 'Send them a message to make their day!'
        : 'Don\'t forget to prepare something nice!',
      data: { 
        type: 'birthday', 
        personId: person.id,
        personName: person.name,
      },
      sound: true,
    },
    trigger: {
      date: triggerDate,
      channelId: 'birthdays',
    },
  });

  return notificationId;
}

// Schedule all birthday notifications for a person
export async function scheduleAllBirthdayNotifications(person: Person): Promise<void> {
  if (!person.birthday) return;

  // Schedule for 7 days before, 1 day before, and day of
  const daysBeforeList = [7, 1, 0];
  
  for (const daysBefore of daysBeforeList) {
    await scheduleBirthdayNotification(person, daysBefore);
  }
}

// Schedule a streak reminder notification
export async function scheduleStreakReminder(): Promise<string | null> {
  // Schedule for 8 PM daily
  const trigger = new Date();
  trigger.setHours(20, 0, 0, 0);
  
  // If it's already past 8 PM, schedule for tomorrow
  if (trigger <= new Date()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Keep your streak going!',
      body: 'Log an interaction today to maintain your friendship streak.',
      data: { type: 'streak_reminder' },
      sound: true,
    },
    trigger: {
      date: trigger,
      repeats: true,
      channelId: 'streaks',
    },
  });

  return notificationId;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel notifications for a specific person
export async function cancelPersonNotifications(personId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.personId === personId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Listen for notification interactions
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Listen for notifications received while app is foregrounded
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

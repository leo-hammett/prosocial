import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '../../stores/authStore';
import { Card, Button } from '../../components/ui';
import { ImportSheet } from '../../components/ImportSheet';
import { registerForPushNotifications } from '../../lib/notifications';
import { getCalendarStatus, disconnectCalendar, useGoogleCalendarAuth } from '../../lib/calendar';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, loading, isDemo } = useAuthStore();
  const [showImport, setShowImport] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  const { signIn: signInGoogle, isConfigured: calendarConfigured } = useGoogleCalendarAuth();
  
  // Check calendar status on mount
  useEffect(() => {
    if (user && !isDemo) {
      getCalendarStatus().then(status => {
        setCalendarConnected(status.connected && status.hasValidToken);
      });
    }
  }, [user, isDemo]);
  
  const handleEnableNotifications = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      setPushToken(token);
      setNotificationsEnabled(true);
      Alert.alert('Success', 'Push notifications enabled!');
    } else {
      Alert.alert('Error', 'Could not enable push notifications. Make sure you\'re on a physical device.');
    }
  };
  
  const handleConnectCalendar = async () => {
    if (!calendarConfigured) {
      Alert.alert('Not Configured', 'Google Calendar integration is not set up. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your environment.');
      return;
    }
    
    const { error } = await signInGoogle();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCalendarConnected(true);
      Alert.alert('Success', 'Google Calendar connected!');
    }
  };
  
  const handleDisconnectCalendar = async () => {
    await disconnectCalendar();
    setCalendarConnected(false);
    Alert.alert('Disconnected', 'Google Calendar has been disconnected.');
  };
  
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };
  
  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will download all your data in a portable format.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export data') },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete account'),
        },
      ]
    );
  };
  
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Account Section */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          Account
        </Text>
        <Card className="mb-6">
          {user ? (
            <>
              <View className="flex-row items-center pb-4 border-b border-gray-100">
                <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center">
                  <FontAwesome name="user" size={20} color="#e05c4f" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-900">{user.email}</Text>
                  <Text className="text-sm text-gray-500">Free Plan</Text>
                </View>
              </View>
              
              <Pressable 
                onPress={handleSignOut}
                className="flex-row items-center py-4"
              >
                <FontAwesome name="sign-out" size={18} color="#ef4444" />
                <Text className="ml-3 text-red-500 font-medium">Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <Pressable 
              onPress={() => router.push('/(auth)/login')}
              className="flex-row items-center py-2"
            >
              <FontAwesome name="sign-in" size={18} color="#e05c4f" />
              <Text className="ml-3 text-primary-500 font-medium">Sign In</Text>
            </Pressable>
          )}
        </Card>
        
        {/* Notifications Section */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          Notifications
        </Text>
        <Card className="mb-6">
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
              <FontAwesome name="bell" size={18} color="#6b7280" />
              <View className="ml-3">
                <Text className="text-gray-900">Birthday Reminders</Text>
                <Text className="text-sm text-gray-500">Get notified before birthdays</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#e05c4f' }}
            />
          </View>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center flex-1">
              <FontAwesome name="fire" size={18} color="#6b7280" />
              <View className="ml-3">
                <Text className="text-gray-900">Streak Reminders</Text>
                <Text className="text-sm text-gray-500">Reminder to log interactions</Text>
              </View>
            </View>
            <Switch
              value={streakReminders}
              onValueChange={setStreakReminders}
              trackColor={{ false: '#d1d5db', true: '#e05c4f' }}
            />
          </View>
        </Card>
        
        {/* Integrations Section */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          Integrations
        </Text>
        <Card className="mb-6">
          <Pressable 
            onPress={calendarConnected ? handleDisconnectCalendar : handleConnectCalendar}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <FontAwesome name="calendar" size={18} color={calendarConnected ? '#22c55e' : '#6b7280'} />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900">Google Calendar</Text>
              <Text className="text-sm text-gray-500">
                {calendarConnected ? 'Connected' : 'See who you\'re meeting today'}
              </Text>
            </View>
            <Text className={calendarConnected ? 'text-green-500 font-medium' : 'text-primary-500 font-medium'}>
              {calendarConnected ? 'Disconnect' : 'Connect'}
            </Text>
          </Pressable>
          
          {!pushToken && (
            <Pressable 
              onPress={handleEnableNotifications}
              className="flex-row items-center py-3"
            >
              <FontAwesome name="bell" size={18} color="#6b7280" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-900">Push Notifications</Text>
                <Text className="text-sm text-gray-500">Enable birthday and streak reminders</Text>
              </View>
              <Text className="text-primary-500 font-medium">Enable</Text>
            </Pressable>
          )}
        </Card>
        
        {/* Data Section */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          Data
        </Text>
        <Card className="mb-6">
          <Pressable 
            onPress={() => setShowImport(true)}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <FontAwesome name="download" size={18} color="#6b7280" />
            <Text className="ml-3 text-gray-900 flex-1">Import Contacts</Text>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
          
          <Pressable 
            onPress={handleExportData}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <FontAwesome name="upload" size={18} color="#6b7280" />
            <Text className="ml-3 text-gray-900 flex-1">Export My Data</Text>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
          
          <Pressable 
            onPress={handleDeleteAccount}
            className="flex-row items-center py-3"
          >
            <FontAwesome name="trash" size={18} color="#ef4444" />
            <Text className="ml-3 text-red-500 flex-1">Delete Account</Text>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
        </Card>
        
        {/* Privacy Section */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          Privacy & Security
        </Text>
        <Card className="mb-6">
          <View className="flex-row items-start py-3 border-b border-gray-100">
            <FontAwesome name="lock" size={18} color="#22c55e" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-medium">End-to-End Encryption</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Your notes are encrypted before leaving your device. We can't read them.
              </Text>
            </View>
          </View>
          
          <Pressable 
            onPress={() => Alert.alert('Privacy Policy', 'Opens privacy policy...')}
            className="flex-row items-center py-3 border-b border-gray-100"
          >
            <FontAwesome name="file-text-o" size={18} color="#6b7280" />
            <Text className="ml-3 text-gray-900 flex-1">Privacy Policy</Text>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
          
          <Pressable 
            onPress={() => Alert.alert('Terms of Service', 'Opens terms...')}
            className="flex-row items-center py-3"
          >
            <FontAwesome name="file-text-o" size={18} color="#6b7280" />
            <Text className="ml-3 text-gray-900 flex-1">Terms of Service</Text>
            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
          </Pressable>
        </Card>
        
        {/* About */}
        <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 ml-1">
          About
        </Text>
        <Card>
          <View className="items-center py-4">
            <Text className="text-3xl mb-2">💝</Text>
            <Text className="text-lg font-semibold text-gray-900">Prosocial</Text>
            <Text className="text-sm text-gray-500">Version 1.0.0</Text>
            <Text className="text-xs text-gray-400 mt-2 text-center">
              Be the friend you want to have
            </Text>
          </View>
        </Card>
      </View>
      
      <ImportSheet visible={showImport} onClose={() => setShowImport(false)} />
    </ScrollView>
  );
}

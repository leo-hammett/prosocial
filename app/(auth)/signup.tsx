import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components/ui';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signUp, loading } = useAuthStore();
  
  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignup = async () => {
    if (!validate()) return;
    
    const { error } = await signUp(email, password);
    
    if (error) {
      Alert.alert('Signup Failed', error.message);
      return;
    }
    
    Alert.alert(
      'Check your email',
      'We sent you a confirmation link. Please verify your email to continue.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Title */}
          <View className="items-center mb-8">
            <Text className="text-5xl mb-4">💝</Text>
            <Text className="text-3xl font-bold text-gray-900">Create account</Text>
            <Text className="text-base text-gray-500 mt-2 text-center">
              Start investing in your relationships
            </Text>
          </View>
          
          {/* Signup Form */}
          <View className="mb-6">
            <View className="mb-4">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />
            </View>
            
            <View className="mb-4">
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                error={errors.password}
              />
            </View>
            
            <View className="mb-6">
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
                error={errors.confirmPassword}
              />
            </View>
            
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
            />
          </View>
          
          {/* Privacy Note */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Text className="text-lg mr-2">🔒</Text>
              <View className="flex-1">
                <Text className="text-sm text-gray-600">
                  Your data is encrypted before it leaves your device. 
                  We can't read your notes about people.
                </Text>
              </View>
            </View>
          </View>
          
          {/* Login Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-primary-500 font-medium">Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

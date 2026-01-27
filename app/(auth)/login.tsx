import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card } from '../../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signInWithGoogle, loading, enterDemoMode } = useAuthStore();
  
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogin = async () => {
    if (!validate()) return;
    
    const { error } = await signIn(email, password);
    
    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }
    
    router.replace('/(tabs)');
  };
  
  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    
    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }
    
    router.replace('/(tabs)');
  };
  
  // Demo mode - skip auth for testing
  const handleDemoMode = () => {
    enterDemoMode();
    router.replace('/(tabs)');
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
            <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
            <Text className="text-base text-gray-500 mt-2">
              Sign in to continue
            </Text>
          </View>
          
          {/* Login Form */}
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
                testID="email-input"
              />
            </View>
            
            <View className="mb-6">
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                error={errors.password}
                testID="password-input"
              />
            </View>
            
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
            />
          </View>
          
          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>
          
          {/* Social Login */}
          <Button
            title="Continue with Google"
            onPress={handleGoogleLogin}
            variant="outline"
            fullWidth
          />
          
          {/* Demo Mode - for testing */}
          <Pressable 
            onPress={handleDemoMode}
            className="mt-4 py-3"
          >
            <Text className="text-center text-gray-500">
              Try Demo Mode
            </Text>
          </Pressable>
          
          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-primary-500 font-medium">Sign Up</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

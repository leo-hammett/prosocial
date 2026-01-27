import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error boundary to catch and display errors gracefully
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service in production
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Text className="text-4xl mb-4">😅</Text>
          <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-base text-gray-500 text-center mb-6 max-w-xs">
            Don't worry, your data is safe. Try again or restart the app.
          </Text>
          
          {__DEV__ && this.state.error && (
            <View className="bg-red-50 p-4 rounded-xl mb-6 max-w-xs">
              <Text className="text-red-700 text-xs font-mono">
                {this.state.error.message}
              </Text>
            </View>
          )}
          
          <Pressable
            onPress={this.handleRetry}
            className="bg-primary-500 px-6 py-3 rounded-xl active:bg-primary-600"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// Simple error display component for inline errors
export function ErrorDisplay({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <View className="bg-red-50 border border-red-200 rounded-xl p-4">
      <View className="flex-row items-center">
        <Text className="text-xl mr-2">⚠️</Text>
        <Text className="flex-1 text-red-700">{message}</Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="mt-3 bg-red-100 py-2 px-4 rounded-lg self-start"
        >
          <Text className="text-red-700 font-medium">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

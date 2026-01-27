import { TextInput, View, Text } from 'react-native';
import { forwardRef, useState } from 'react';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  testID,
}, ref) => {
  const [focused, setFocused] = useState(false);
  
  return (
    <View className="w-full">
      {label && (
        <Text className="text-gray-700 font-medium mb-1.5 text-sm">
          {label}
        </Text>
      )}
      
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        testID={testID}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full px-4 py-3 rounded-xl text-base text-gray-900
          ${multiline ? 'min-h-[100px] text-base' : ''}
          ${focused 
            ? 'border-2 border-primary-500 bg-white' 
            : 'border border-gray-300 bg-gray-50'
          }
          ${error ? 'border-red-500' : ''}
        `}
        style={multiline ? { textAlignVertical: 'top' } : undefined}
      />
      
      {error && (
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

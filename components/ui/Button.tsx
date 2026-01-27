import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { forwardRef } from 'react';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<View, ButtonProps>(({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
}, ref) => {
  const isDisabled = disabled || loading;
  
  // Base styles
  const baseStyles = 'flex-row items-center justify-center rounded-xl';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-gray-200 active:bg-gray-300',
    outline: 'border-2 border-primary-500 bg-transparent active:bg-primary-50',
    ghost: 'bg-transparent active:bg-gray-100',
    danger: 'bg-red-500 active:bg-red-600',
  };
  
  // Text styles
  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-800 font-semibold',
    outline: 'text-primary-500 font-semibold',
    ghost: 'text-gray-700 font-medium',
    danger: 'text-white font-semibold',
  };
  
  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
      `}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'danger' ? 'white' : '#374151'} 
          size="small" 
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textStyles[variant]} ${textSizeStyles[size]}`}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

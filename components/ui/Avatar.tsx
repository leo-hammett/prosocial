import { View, Text, Image } from 'react-native';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  // Get initials from name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Generate a consistent color based on name
  const colors = [
    'bg-primary-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const sizeStyles = {
    sm: { container: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-12 h-12', text: 'text-base' },
    lg: { container: 'w-16 h-16', text: 'text-xl' },
    xl: { container: 'w-24 h-24', text: 'text-3xl' },
  };
  
  const imageSizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };
  
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${sizeStyles[size].container} rounded-full`}
        style={{ width: imageSizes[size], height: imageSizes[size] }}
      />
    );
  }
  
  return (
    <View 
      className={`
        ${sizeStyles[size].container} 
        ${bgColor} 
        rounded-full 
        items-center 
        justify-center
      `}
    >
      <Text className={`${sizeStyles[size].text} text-white font-semibold`}>
        {initials}
      </Text>
    </View>
  );
}

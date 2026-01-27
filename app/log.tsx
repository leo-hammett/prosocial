import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuickLogSheet } from '../components/QuickLogSheet';

export default function LogScreen() {
  const router = useRouter();
  
  return (
    <View className="flex-1">
      <QuickLogSheet 
        visible={true}
        onClose={() => router.back()}
      />
    </View>
  );
}

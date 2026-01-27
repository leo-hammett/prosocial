import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

// Animated skeleton pulse effect
function SkeletonPulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

// Skeleton for a person card
export function PersonCardSkeleton() {
  return (
    <SkeletonPulse>
      <View className="bg-white rounded-2xl p-4 mb-3">
        <View className="flex-row items-start">
          {/* Avatar skeleton */}
          <View className="w-16 h-16 rounded-full bg-gray-200" />
          
          <View className="flex-1 ml-4">
            {/* Name skeleton */}
            <View className="w-32 h-5 bg-gray-200 rounded mb-2" />
            
            {/* Tags skeleton */}
            <View className="flex-row gap-2 mb-2">
              <View className="w-16 h-5 bg-gray-200 rounded-full" />
              <View className="w-12 h-5 bg-gray-200 rounded-full" />
            </View>
            
            {/* Last contacted skeleton */}
            <View className="w-24 h-4 bg-gray-200 rounded" />
          </View>
        </View>
      </View>
    </SkeletonPulse>
  );
}

// Skeleton for the today screen
export function TodayScreenSkeleton() {
  return (
    <View className="p-4">
      {/* Streak summary skeleton */}
      <SkeletonPulse>
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="w-20 h-4 bg-gray-200 rounded mb-2" />
              <View className="w-24 h-8 bg-gray-200 rounded" />
            </View>
            <View className="w-20 h-8 bg-gray-200 rounded-xl" />
          </View>
        </View>
      </SkeletonPulse>

      {/* Today items skeleton */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-16 h-5 bg-gray-200 rounded" />
        <View className="w-20 h-4 bg-gray-200 rounded" />
      </View>

      {[1, 2, 3].map(i => (
        <TodayCardSkeleton key={i} />
      ))}
    </View>
  );
}

// Skeleton for a today card
export function TodayCardSkeleton() {
  return (
    <SkeletonPulse>
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
        <View className="flex-row items-center">
          {/* Emoji skeleton */}
          <View className="w-8 h-8 bg-gray-200 rounded mr-3" />
          
          {/* Avatar skeleton */}
          <View className="w-12 h-12 rounded-full bg-gray-200" />
          
          <View className="flex-1 ml-3">
            <View className="w-16 h-4 bg-gray-200 rounded mb-1" />
            <View className="w-24 h-5 bg-gray-200 rounded mb-1" />
            <View className="w-20 h-4 bg-gray-200 rounded" />
          </View>
          
          <View className="w-8 h-8 bg-gray-200 rounded-full" />
        </View>
      </View>
    </SkeletonPulse>
  );
}

// Skeleton for streak cards
export function StreakCardSkeleton() {
  return (
    <SkeletonPulse>
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-200 rounded mr-2" />
            <View>
              <View className="w-24 h-5 bg-gray-200 rounded mb-1" />
              <View className="w-40 h-3 bg-gray-200 rounded" />
            </View>
          </View>
          <View className="items-end">
            <View className="w-8 h-8 bg-gray-200 rounded" />
            <View className="w-12 h-3 bg-gray-200 rounded mt-1" />
          </View>
        </View>
        <View className="w-full h-12 bg-gray-100 rounded-xl" />
      </View>
    </SkeletonPulse>
  );
}

// Skeleton for people list
export function PeopleListSkeleton() {
  return (
    <View className="p-4">
      {/* Search bar skeleton */}
      <View className="mb-4">
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="flex-row gap-2">
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="w-16 h-8 bg-gray-200 rounded-full" />
          ))}
        </View>
      </View>

      {/* People cards skeleton */}
      {[1, 2, 3, 4].map(i => (
        <PersonCardSkeleton key={i} />
      ))}
    </View>
  );
}

// Generic content placeholder
export function ContentPlaceholder({ 
  width = 100, 
  height = 20 
}: { 
  width?: number | string; 
  height?: number;
}) {
  return (
    <SkeletonPulse>
      <View 
        className="bg-gray-200 rounded"
        style={{ 
          width: typeof width === 'number' ? width : undefined,
          height,
        }}
      />
    </SkeletonPulse>
  );
}

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withDelay,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';

const AnimatedCard = ({ children, index }: { children: React.ReactNode; index: number }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(index * 100, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [30, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
});

export default AnimatedCard;
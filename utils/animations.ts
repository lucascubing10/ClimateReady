import { 
  withSpring, 
  withTiming, 
  withDelay, 
  withSequence,
  withRepeat,
  Easing 
} from 'react-native-reanimated';

export const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 120,
  overshootClamping: false,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

export const timingConfig = {
  duration: 300,
  easing: Easing.inOut(Easing.ease),
};

export const enterAnimation = (index: number) => {
  return withDelay(index * 100, withSpring(1, springConfig));
};

export const pulseAnimation = () => {
  return withRepeat(
    withSequence(
      withTiming(1.05, { duration: 500 }),
      withTiming(1, { duration: 500 })
    ),
    -1,
    true
  );
};

export const shakeAnimation = () => {
  return withSequence(
    withTiming(-5, { duration: 50 }),
    withTiming(5, { duration: 50 }),
    withTiming(-5, { duration: 50 }),
    withTiming(5, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};
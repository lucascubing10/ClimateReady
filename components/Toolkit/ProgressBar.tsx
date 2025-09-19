import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar = ({ percentage }: ProgressBarProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(percentage / 100, {
      damping: 20,
      stiffness: 90
    });
  }, [percentage]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
    };
  });

  const getProgressColor = () => {
    if (percentage < 33) return '#ef4444'; // red
    if (percentage < 66) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill, 
            progressStyle, 
            { backgroundColor: getProgressColor() }
          ]} 
        />
      </View>
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText}>{Math.round(percentage)}% complete</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  percentageText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default ProgressBar;
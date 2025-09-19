import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withSequence,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface ProgressScoringProps {
  score: number;
  progress: any;
}

const ProgressScoring = ({ score, progress }: ProgressScoringProps) => {
  const animatedScore = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Animate score change
    animatedScore.value = withSpring(score, {
      damping: 10,
      stiffness: 50
    });

    // Pulse animation when score updates
    pulse.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  }, [score]);

  const scoreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  if (!progress) {
    return (
      <View style={styles.container}>
        <Text>Loading progress...</Text>
      </View>
    );
  }

  // Calculate overall progress
  const totalItems = Object.values(progress.checklists).reduce((total: number, category: any) => {
    return total + Object.values(category).filter(Boolean).length;
  }, 0);

  const completedItems = Object.values(progress.checklists).reduce((completed: number, category: any) => {
    return completed + Object.values(category).filter(item => item === true).length;
  }, 0);

  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>Your Preparedness Score</Text>
        <Animated.Text style={[styles.scoreValue, scoreStyle]}>
          {Math.round(score)}
        </Animated.Text>
        <Text style={styles.scoreSubtitle}>out of 1000 points</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${overallProgress}%` }
            ]} 
          />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completedItems}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{progress.completedCategories || 0}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3b82f6',
  },
  scoreSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressSection: {
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
});

export default ProgressScoring;
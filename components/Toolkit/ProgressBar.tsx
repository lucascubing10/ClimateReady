import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${Math.min(100, Math.max(0, progress))}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5ba24f',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 30,
  },
});

export { ProgressBar };
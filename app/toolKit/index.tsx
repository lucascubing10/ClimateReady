import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import ChecklistSection from '@/components/Toolkit/ChecklistSection';
import ProgressScoring from '@/components/Toolkit/ProgressScoring';
import { getUserProgress, updateChecklistItem } from '@/utils/storage';
import { calculateProgressPercentage, calculateScore } from '@/utils/scoring';

const { width } = Dimensions.get('window');

const ToolkitScreen = () => {
  const [userProgress, setUserProgress] = useState<any>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const progress = await getUserProgress();
      setUserProgress(progress);
      // Calculate scores
      const score = calculateScore(progress);
      const percentage = calculateProgressPercentage(progress);
      setTotalScore(score);
      setProgressPercentage(percentage);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  const handleChecklistToggle = async (categoryId: string, itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem(categoryId, itemId, completed);
      // Reload progress to get updated state
      const updatedProgress = await getUserProgress();
      setUserProgress(updatedProgress);
      // Update scores
      const newScore = calculateScore(updatedProgress);
      const newPercentage = calculateProgressPercentage(updatedProgress);
      setTotalScore(newScore);
      setProgressPercentage(newPercentage);
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {/* Hero header */}
      <Animated.View entering={FadeInDown.duration(700)} style={styles.heroHeader}>
        <Text style={styles.title}>🧰 Preparedness Toolkit</Text>
        <Text style={styles.subtitle}>Be ready for any emergency</Text>
      </Animated.View>

      {/* Progress and Scoring Display */}
      <Animated.View entering={ZoomIn.duration(600)} style={styles.scoreCard}>
        <ProgressScoring 
          score={totalScore}
          progressPercentage={progressPercentage}
          progress={userProgress}
        />
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        <ChecklistSection 
          progress={userProgress}
          onToggleItem={handleChecklistToggle}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  heroHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 18,
    backgroundColor: '#e0f2fe',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 10,
    shadowColor: '#0284c7',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBg: {
    width: width * 0.22,
    height: width * 0.22,
    backgroundColor: '#bae6fd',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#0284c7',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  heroImage: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0284c7',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  scoreCard: {
    marginHorizontal: 0,
    marginTop: -18,
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'visible',
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 0,
  },
});

export default ToolkitScreen;
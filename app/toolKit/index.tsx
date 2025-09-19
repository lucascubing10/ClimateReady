import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChecklistSection from '@/components/Toolkit/ChecklistSection';
import ProgressScoring from '@/components/Toolkit/ProgressScoring';
import { getUserProgress, updateChecklistItem } from '@/utils/storage';
import { calculateProgressPercentage, calculateScore } from '@/utils/scoring';
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
      <View style={styles.header}>
        <Text style={styles.title}>Preparedness Toolkit</Text>
        <Text style={styles.subtitle}>Be ready for any emergency</Text>
      </View>

      {/* Progress and Scoring Display */}
      <ProgressScoring 
        score={totalScore}
        progress={userProgress}
      />

      <ScrollView style={styles.content}>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 10,
  },
});

export default ToolkitScreen;
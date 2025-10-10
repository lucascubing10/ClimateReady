import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MedicalGameProps {
  scenario: any;
  difficulty: number;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const MedicalGame: React.FC<MedicalGameProps> = ({ scenario, difficulty, onGameEnd }) => {
  const initialTime = 70 - (difficulty * 10);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Someone has collapsed! They are not breathing.');
  const [action, setAction] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);

  const heartRate = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartRate.value }],
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isGameOver) {
            endGame(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleAction = (choice: string) => {
    if (isGameOver) return;
    setAction(choice);
    if (choice === 'cpr') {
      setScore(100 + (difficulty * 10));
      setMessage('You started CPR. You are giving them a chance to survive until help arrives.');
      heartRate.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ), -1, true
      );
      setTimeout(() => endGame(true), 4000);
    } else {
      setMessage('That was not the right immediate action.');
      heartRate.value = withTiming(0, { duration: 1000 });
      setTimeout(() => endGame(false), 2000);
    }
  };

  const endGame = (victory: boolean) => {
    setIsGameOver(true);
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: initialTime - timeLeft,
      actionsTaken: 1,
      healthRemaining: victory ? 100 : 0,
      objectivesCompleted: victory ? 1 : 0,
      totalObjectives: 1,
      date: new Date().toISOString(),
      difficulty: difficulty,
    };
    onGameEnd(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <View style={styles.gameArea}>
        <Animated.Text style={[styles.heart, heartStyle]}>❤️</Animated.Text>
        <Text style={styles.message}>{message}</Text>
        {action === '' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('cpr')}>
              <Text style={styles.actionButtonText}>Start CPR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('call')}>
              <Text style={styles.actionButtonText}>Call 911 first</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('wait')}>
              <Text style={styles.actionButtonText}>Wait for help</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.quitButton} onPress={() => onGameEnd({} as any)}>
        <Text style={styles.quitButtonText}>Quit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  scenarioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  timer: {
    fontSize: 16,
    color: '#f1c40f',
  },
  score: {
    fontSize: 16,
    color: '#2ecc71',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    fontSize: 100,
    marginBottom: 20,
  },
  message: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  actionsContainer: {
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#c0392b',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  quitButton: {
    position: 'absolute',
    top: 60,
    left: 16,
  },
  quitButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default MedicalGame;

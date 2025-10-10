import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface TsunamiGameProps {
  scenario: any;
  difficulty: number;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const TsunamiGame: React.FC<TsunamiGameProps> = ({ scenario, difficulty, onGameEnd }) => {
  const initialTime = 195 - (difficulty * 15);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('You feel a strong earthquake. You are in a coastal area. What should you be concerned about?');
  const [stage, setStage] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const wavePosition = useSharedValue(height);
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wavePosition.value }],
  }));

  useEffect(() => {
    if (stage === 0) return;

    const waveDuration = (initialTime - 30) * 1000; // Wave hits near the end of the timer
    wavePosition.value = withTiming(height / 2, { duration: waveDuration });

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
  }, [stage, isGameOver]);

  const handleAction = (isCorrect: boolean) => {
    if (isGameOver) return;
    if (isCorrect) {
      setScore(prev => prev + 50 + (difficulty * 5));
      if (stage === 0) {
        setMessage('Correct. A tsunami could be coming. You must evacuate to higher ground immediately.');
        setStage(1);
      } else {
        setIsGameOver(true);
        setMessage('You reached high ground just in time! You are safe.');
        wavePosition.value = withTiming(height, { duration: 2000 });
        setTimeout(() => endGame(true), 2000);
      }
    } else {
      setIsGameOver(true);
      setMessage('That was not the primary concern. You lost valuable time.');
      wavePosition.value = withTiming(0, { duration: 1000 });
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
      actionsTaken: stage + 1,
      healthRemaining: 100,
      objectivesCompleted: victory ? 2 : stage,
      totalObjectives: 2,
      date: new Date().toISOString(),
      difficulty: difficulty,
    };
    onGameEnd(result);
  };

  const renderStage = () => {
    if (stage === 0) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(true)}>
            <Text style={styles.actionButtonText}>A Tsunami</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
            <Text style={styles.actionButtonText}>Aftershocks</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (stage === 1) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(true)}>
            <Text style={styles.actionButtonText}>Run to the hills</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
            <Text style={styles.actionButtonText}>Go to the beach to watch</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.wave, waveStyle]} />
      <View style={styles.header}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.message}>{message}</Text>
        {renderStage()}
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
    backgroundColor: '#1abc9c',
    padding: 16,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: '#2980b9',
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
    zIndex: 1,
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
    color: '#2c3e50',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    backgroundColor: '#16a085',
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
    zIndex: 2,
  },
  quitButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TsunamiGame;

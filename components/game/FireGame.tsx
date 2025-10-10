import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FireGameProps {
  scenario: any;
  difficulty: number;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const FireGame: React.FC<FireGameProps> = ({ scenario, difficulty, onGameEnd }) => {
  const initialTime = 55 - (difficulty * 5);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('You smell smoke! The fire alarm is blaring. What is your first move?');
  const [stage, setStage] = useState(0);

  const smokeOpacity = useSharedValue(0);

  const smokeStyle = useAnimatedStyle(() => ({
    opacity: smokeOpacity.value,
  }));

  useEffect(() => {
    if (stage === 0) return;

    smokeOpacity.value = withTiming(0.6, { duration: 10000 });

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const handleAction = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 50 + (difficulty * 5));
      if (stage === 0) {
        setMessage('Correct! You feel the door. It\'s cool. What next?');
        setStage(1);
      } else {
        smokeOpacity.value = withTiming(0, { duration: 1000 });
        setMessage('You escaped safely! Well done!');
        setTimeout(() => endGame(true), 2000);
      }
    } else {
      smokeOpacity.value = withTiming(1, { duration: 500 });
      setMessage('A blast of heat hits you. Wrong choice!');
      setTimeout(() => endGame(false), 2000);
    }
  };

  const endGame = (victory: boolean) => {
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: initialTime - timeLeft,
      actionsTaken: stage + 1,
      healthRemaining: victory ? 100 : 20,
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
            <Text style={styles.actionButtonText}>Check the door for heat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
            <Text style={styles.actionButtonText}>Open the door immediately</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (stage === 1) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(true)}>
            <Text style={styles.actionButtonText}>Crawl low to the exit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
            <Text style={styles.actionButtonText}>Run through the smoke</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.smokeOverlay, smokeStyle]} pointerEvents="none" />
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
    backgroundColor: '#c0392b',
    padding: 16,
  },
  smokeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
    zIndex: 2,
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
    color: '#27ae60',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    backgroundColor: '#e67e22',
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
    zIndex: 3,
  },
  quitButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default FireGame;
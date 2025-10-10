import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';

const { width, height } = Dimensions.get('window');

interface TsunamiGameProps {
  scenario: any;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const TsunamiGame: React.FC<TsunamiGameProps> = ({ scenario, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(180);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('You feel a strong earthquake. You are in a coastal area. What should you be concerned about?');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage === 0) return;
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
      setScore(prev => prev + 50);
      if (stage === 0) {
        setMessage('Correct. A tsunami could be coming. You must evacuate to higher ground immediately.');
        setStage(1);
      } else {
        setMessage('You reached high ground just in time! You are safe.');
        setTimeout(() => endGame(true), 2000);
      }
    } else {
      setMessage('That was not the primary concern. You lost valuable time.');
      setTimeout(() => endGame(false), 2000);
    }
  };

  const endGame = (victory: boolean) => {
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: 180 - timeLeft,
      actionsTaken: stage + 1,
      healthRemaining: 100,
      objectivesCompleted: victory ? 2 : stage,
      totalObjectives: 2,
      date: new Date().toISOString(),
      difficulty: 3,
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
    color: '#2c3e50',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  quitButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TsunamiGame;

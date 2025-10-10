import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';

const { width, height } = Dimensions.get('window');

export interface EarthquakeGameProps {
  scenario: any;
  difficulty: number;
  onGameEnd: (result: Omit<GameResult, 'id'>) => Promise<void>;
}

const EarthquakeGame: React.FC<EarthquakeGameProps> = ({ scenario, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('A violent shaking begins! What do you do?');
  const [actionTaken, setActionTaken] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(actionTaken && score > 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [actionTaken, score]);

  const handleAction = (isCorrect: boolean) => {
    if (actionTaken) return;
    setActionTaken(true);
    if (isCorrect) {
      setScore(100);
      setMessage('Good choice! You took cover correctly. The shaking subsides.');
      setTimeout(() => endGame(true), 2000);
    } else {
      setScore(0);
      setMessage('Wrong move! You were hit by falling debris.');
      setTimeout(() => endGame(false), 2000);
    }
  };

  const endGame = (victory: boolean) => {
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: 60 - timeLeft,
      actionsTaken: actionTaken ? 1 : 0,
      healthRemaining: victory ? 100 : 50,
      objectivesCompleted: victory ? 1 : 0,
      totalObjectives: 1,
      date: new Date().toISOString(),
      difficulty: 3, // Placeholder
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
        <Text style={styles.message}>{message}</Text>
        {!actionTaken && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(true)}>
              <Text style={styles.actionButtonText}>Drop, Cover, and Hold On</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
              <Text style={styles.actionButtonText}>Run for the exit</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(false)}>
              <Text style={styles.actionButtonText}>Stand in a doorway</Text>
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
    backgroundColor: '#2c3e50',
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
    color: '#f39c12',
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
    backgroundColor: '#3498db',
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
    color: '#e74c3c',
    fontSize: 16,
  },
});

export default EarthquakeGame;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';

const { width, height } = Dimensions.get('window');

interface FloodGameProps {
  scenario: any;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const FloodGame: React.FC<FloodGameProps> = ({ scenario, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Floodwaters are rising rapidly. You need to get to safety!');
  const [hasSupplies, setHasSupplies] = useState(false);

  useEffect(() => {
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
  }, []);

  const grabSupplies = () => {
    if (hasSupplies) return;
    setHasSupplies(true);
    setScore(prev => prev + 30);
    setTimeLeft(prev => prev - 15);
    setMessage('You grabbed your emergency kit. Now, get to higher ground!');
  };

  const moveToHigherGround = () => {
    if (hasSupplies) {
      setScore(prev => prev + 70);
      setMessage('You reached the roof with your supplies. You are safe for now.');
      setTimeout(() => endGame(true), 2000);
    } else {
      setScore(prev => prev + 40);
      setMessage('You reached the roof, but without supplies, your situation is precarious.');
      setTimeout(() => endGame(true), 2000);
    }
  };

  const endGame = (victory: boolean) => {
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: 90 - timeLeft,
      actionsTaken: hasSupplies ? 2 : 1,
      healthRemaining: 100,
      objectivesCompleted: victory ? 1 : 0,
      totalObjectives: 1,
      date: new Date().toISOString(),
      difficulty: 3,
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
        <View style={styles.actionsContainer}>
          {!hasSupplies && (
            <TouchableOpacity style={styles.actionButton} onPress={grabSupplies}>
              <Text style={styles.actionButtonText}>Grab Emergency Kit (-15s)</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={moveToHigherGround}>
            <Text style={styles.actionButtonText}>Move to Higher Ground</Text>
          </TouchableOpacity>
           <TouchableOpacity style={styles.actionButton} onPress={() => endGame(false)}>
            <Text style={styles.actionButtonText}>Try to drive away</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#2980b9',
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
    color: '#ecf0f1',
    fontSize: 16,
  },
});

export default FloodGame;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameResult } from '@/utils/gameStorage';

const { width, height } = Dimensions.get('window');

interface HurricaneGameProps {
  scenario: any;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const HurricaneGame: React.FC<HurricaneGameProps> = ({ scenario, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('A hurricane is approaching. You have 2 minutes to prepare!');
  const [prepared, setPrepared] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(prepared.length > 2);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [prepared]);

  const handlePreparation = (item: string) => {
    if (prepared.includes(item)) return;
    const newPrepared = [...prepared, item];
    setPrepared(newPrepared);
    setScore(prev => prev + 25);
    setMessage(`You've secured the ${item}. What's next?`);
    if (newPrepared.length === 4) {
      endGame(true);
    }
  };

  const endGame = (victory: boolean) => {
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score,
      victory,
      timeSpent: 120 - timeLeft,
      actionsTaken: prepared.length,
      healthRemaining: 100,
      objectivesCompleted: prepared.length,
      totalObjectives: 4,
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
          <TouchableOpacity 
            style={[styles.actionButton, prepared.includes('windows') && styles.actionDone]} 
            onPress={() => handlePreparation('windows')}
          >
            <Text style={styles.actionButtonText}>Board up windows</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, prepared.includes('supplies') && styles.actionDone]} 
            onPress={() => handlePreparation('supplies')}
          >
            <Text style={styles.actionButtonText}>Gather supplies</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, prepared.includes('furniture') && styles.actionDone]} 
            onPress={() => handlePreparation('furniture')}
          >
            <Text style={styles.actionButtonText}>Secure outdoor furniture</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, prepared.includes('evacuation') && styles.actionDone]} 
            onPress={() => handlePreparation('evacuation')}
          >
            <Text style={styles.actionButtonText}>Know your evacuation route</Text>
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
    backgroundColor: '#34495e',
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
  actionDone: {
    backgroundColor: '#27ae60',
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

export default HurricaneGame;

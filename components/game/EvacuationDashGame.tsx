import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { GameResult } from '@/utils/gameStorage';

const { width } = Dimensions.get('window');
const CELL_SIZE = width / 6;

// --- Game Data & Types ---

interface MapCell {
  type: 'start' | 'finish' | 'road' | 'obstacle' | 'event';
  eventName?: 'traffic_jam' | 'damaged_bridge';
}

interface GameEvent {
  title: string;
  description: string;
  choices: EventChoice[];
}

interface EventChoice {
  text: string;
  timeCost: number;
  scoreChange: number;
  isSafe: boolean;
  outcome: string;
}

const gameMap: MapCell[][] = [
  [{ type: 'start' }, { type: 'road' }, { type: 'road' }, { type: 'obstacle' }],
  [{ type: 'road' }, { type: 'event', eventName: 'traffic_jam' }, { type: 'obstacle' }, { type: 'road' }],
  [{ type: 'road' }, { type: 'road' }, { type: 'event', eventName: 'damaged_bridge' }, { type: 'road' }],
  [{ type: 'obstacle' }, { type: 'road' }, { type: 'road' }, { type: 'finish' }],
];

const events: Record<string, GameEvent> = {
  traffic_jam: {
    title: "Gridlock Ahead!",
    description: "The main highway is completely blocked by traffic. What do you do?",
    choices: [
      { text: "Wait for it to clear", timeCost: 30, scoreChange: -10, isSafe: true, outcome: "You waited, but lost precious time." },
      { text: "Take a risky shortcut", timeCost: 10, scoreChange: 20, isSafe: false, outcome: "The shortcut was faster but dangerous!" },
    ],
  },
  damaged_bridge: {
    title: "Damaged Bridge",
    description: "A bridge on your route looks unstable. It might not hold.",
    choices: [
      { text: "Find a longer, safer route", timeCost: 25, scoreChange: 10, isSafe: true, outcome: "You chose safety over speed. A wise decision." },
      { text: "Risk crossing the bridge", timeCost: 5, scoreChange: -20, isSafe: false, outcome: "You made it, but that was a huge risk!" },
    ],
  },
};

// --- Component ---

interface EvacuationDashGameProps {
  scenario: any;
  onGameEnd: (result: Omit<GameResult, 'id'>) => void;
}

const EvacuationDashGame: React.FC<EvacuationDashGameProps> = ({ scenario, onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(100);
  const [message, setMessage] = useState('An alert sounds! You must evacuate. Tap to move.');
  const [playerPosition, setPlayerPosition] = useState([0, 0]);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Game Loop ---
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

  // --- Player Movement ---
  const handleMove = (row: number, col: number) => {
    const cell = gameMap[row][col];
    if (cell.type === 'obstacle') {
      setMessage("You can't go there, it's blocked!");
      return;
    }

    const [pRow, pCol] = playerPosition;
    const distance = Math.abs(pRow - row) + Math.abs(pCol - col);
    if (distance !== 1) {
      setMessage("You can only move to adjacent squares.");
      return;
    }

    setPlayerPosition([row, col]);
    setTimeLeft(prev => prev - 2); // Time cost for moving

    if (cell.type === 'event' && cell.eventName) {
      setCurrentEvent(events[cell.eventName]);
      setModalVisible(true);
    } else if (cell.type === 'finish') {
      endGame(true);
    } else {
      setMessage("Keep moving towards the safe zone!");
    }
  };

  // --- Event Handling ---
  const handleChoice = (choice: EventChoice) => {
    setTimeLeft(prev => prev - choice.timeCost);
    setScore(prev => prev + choice.scoreChange);
    setMessage(choice.outcome);
    setModalVisible(false);
    setCurrentEvent(null);
  };

  // --- Game End ---
  const endGame = useCallback((victory: boolean) => {
    const finalScore = victory ? score + timeLeft : score - 50;
    const result: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario.title,
      scenarioType: scenario.type,
      score: Math.max(0, finalScore),
      victory,
      timeSpent: 120 - timeLeft,
      actionsTaken: 5, // Placeholder
      healthRemaining: victory ? 100 : 50,
      objectivesCompleted: victory ? 1 : 0,
      totalObjectives: 1,
      date: new Date().toISOString(),
      difficulty: scenario.difficulty || 3,
    };
    onGameEnd(result);
  }, [timeLeft, score, scenario, onGameEnd]);


  // --- Rendering ---
  const renderMap = () => {
    return gameMap.map((row, rIndex) => (
      <View key={rIndex} style={styles.mapRow}>
        {row.map((cell, cIndex) => {
          const isPlayerHere = playerPosition[0] === rIndex && playerPosition[1] === cIndex;
          return (
            <TouchableOpacity key={cIndex} style={[styles.cell, styles[cell.type]]} onPress={() => handleMove(rIndex, cIndex)}>
              {isPlayerHere && <View style={styles.player} />}
              <Text style={styles.cellText}>
                {cell.type === 'start' && '🏠'}
                {cell.type === 'finish' && '✅'}
                {cell.type === 'event' && '❓'}
                {cell.type === 'obstacle' && '❌'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
        <Text style={styles.timer}>Time: {timeLeft}s</Text>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      {/* Message Bar */}
      <Text style={styles.message}>{message}</Text>

      {/* Game Map */}
      <View style={styles.gameArea}>
        {renderMap()}
      </View>

      {/* Quit Button */}
      <TouchableOpacity style={styles.quitButton} onPress={() => onGameEnd({} as any)}>
        <Text style={styles.quitButtonText}>Quit</Text>
      </TouchableOpacity>

      {/* Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentEvent?.title}</Text>
            <Text style={styles.modalDescription}>{currentEvent?.description}</Text>
            {currentEvent?.choices.map((choice, index) => (
              <TouchableOpacity key={index} style={styles.choiceButton} onPress={() => handleChoice(choice)}>
                <Text style={styles.choiceButtonText}>{choice.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scenarioTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  timer: { fontSize: 16, color: '#ffc107' },
  score: { fontSize: 16, color: '#4caf50' },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  start: { backgroundColor: '#2ecc71' },
  finish: { backgroundColor: '#3498db' },
  road: { backgroundColor: '#7f8c8d' },
  obstacle: { backgroundColor: '#34495e' },
  event: { backgroundColor: '#f39c12' },
  cellText: { fontSize: 24 },
  player: {
    width: CELL_SIZE / 2,
    height: CELL_SIZE / 2,
    borderRadius: CELL_SIZE / 4,
    backgroundColor: 'red',
    position: 'absolute',
  },
  quitButton: {
    position: 'absolute',
    top: 55,
    left: 16,
  },
  quitButtonText: { color: '#e91e63', fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  choiceButton: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  choiceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EvacuationDashGame;

// app/(tabs)/toolkit/simulations.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Alert,
  Modal,
  Animated
} from 'react-native';
import EvacuationDashGame from '@/components/game/EvacuationDashGame';
import EarthquakeGame from '@/components/game/EarthquakeGame';
import FireGame from '@/components/game/FireGame';
import FloodGame from '@/components/game/FloodGame';
import HurricaneGame from '@/components/game/HurricaneGame';
import MedicalGame from '@/components/game/MedicalGame';
import TsunamiGame from '@/components/game/TsunamiGame';
import { GameStorage, GameResult } from '@/utils/gameStorage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type GameMode = 'menu' | 'ai-game' | 'traditional' | 'results' | 'evacuation-dash';
type ScenarioType = 'earthquake' | 'fire' | 'flood' | 'hurricane' | 'medical' | 'tsunami' | 'evacuation-dash';

export default function SimulationsScreen() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(3);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    victories: 0,
    averageScore: 0,
    bestScore: 0
  });
  const [recentGames, setRecentGames] = useState<GameResult[]>([]);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  useEffect(() => {
    loadGameStats();
  }, []);

  const loadGameStats = async () => {
    const stats = await GameStorage.getStats();
    const recent = await GameStorage.getGameResults();
    setGameStats(stats);
    setRecentGames(recent.slice(0, 3));
  };

  const startAIGame = (scenario: { type: ScenarioType; title: string; description: string; color: string }) => {
    setSelectedScenario(scenario);
    if (scenario.type === 'evacuation-dash') {
      setGameMode('evacuation-dash');
    } else {
      setShowDifficultyModal(true);
    }
  };

  const confirmAIGame = () => {
    setShowDifficultyModal(false);
    setGameMode('ai-game');
  };

  const handleGameEnd = async (result: Omit<GameResult, 'id'>) => {
    if (result && result.scenarioTitle) {
      await GameStorage.saveGameResult(result);
    }
    loadGameStats(); // Refresh stats after game ends
    setGameMode('results');
  };

  const getScenarioIcon = (type: ScenarioType) => {
    const icons = {
      earthquake: '⚡',
      fire: '🔥',
      flood: '🌊',
      hurricane: '🌀',
      medical: '🏥',
      tsunami: '🌊',
      'evacuation-dash': '🏃‍♂️'
    };
    return icons[type];
  };

  const getScenarioColor = (type: ScenarioType) => {
    const colors = {
      earthquake: '#8B4513',
      fire: '#FF6B35',
      flood: '#3498db',
      hurricane: '#2980b9',
      medical: '#e74c3c',
      tsunami: '#1abc9c',
      'evacuation-dash': '#4caf50'
    };
    return colors[type];
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '⚪'.repeat(5 - difficulty);
  };

  // AI Game Scenarios
  const aiScenarios: { type: ScenarioType; title: string; description: string; color: string }[] = [
    {
      type: 'evacuation-dash',
      title: 'Evacuation Dash',
      description: 'A real-time decision simulator for evacuating from a disaster zone.',
      color: '#4caf50'
    },
    {
      type: 'earthquake',
      title: 'Earthquake Response',
      description: 'Office building survival with realistic aftershocks and structural hazards',
      color: '#8B4513'
    },
    {
      type: 'fire',
      title: 'Fire Escape',
      description: 'Apartment fire evacuation with smoke and heat simulation',
      color: '#FF6B35'
    },
    {
      type: 'flood',
      title: 'Flash Flood',
      description: 'Rising water survival with current and debris hazards',
      color: '#3498db'
    },
    {
      type: 'hurricane',
      title: 'Hurricane Preparedness',
      description: 'Storm survival with wind, rain, and flooding challenges',
      color: '#2980b9'
    },
    {
      type: 'medical',
      title: 'Emergency First Aid',
      description: 'Medical emergency response with triage decisions',
      color: '#e74c3c'
    },
    {
      type: 'tsunami',
      title: 'Tsunami Evacuation',
      description: 'Coastal evacuation with wave timing and route planning',
      color: '#1abc9c'
    }
  ];

  if (gameMode === 'evacuation-dash') {
    return (
      <EvacuationDashGame
        scenario={selectedScenario}
        onGameEnd={handleGameEnd}
      />
    );
  }

  if (gameMode === 'ai-game') {
    switch (selectedScenario.type) {
      case 'earthquake':
        return <EarthquakeGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      case 'fire':
        return <FireGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      case 'flood':
        return <FloodGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      case 'hurricane':
        return <HurricaneGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      case 'medical':
        return <MedicalGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      case 'tsunami':
        return <TsunamiGame scenario={selectedScenario} difficulty={selectedDifficulty} onGameEnd={handleGameEnd} />;
      default:
        setGameMode('menu');
        return null;
    }
  }

  if (gameMode === 'results') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/tabs/toolKit')}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.title}>Training Complete</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.resultsContent}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Latest Performance</Text>
            {recentGames.length > 0 ? (
              <View style={styles.latestResult}>
                <Text style={styles.latestScenario}>
                  {getScenarioIcon(recentGames[0].scenarioType as ScenarioType)} {recentGames[0].scenarioTitle}
                </Text>
                <Text style={styles.latestScore}>Score: {recentGames[0].score}</Text>
                <Text style={[
                  styles.latestOutcome,
                  { color: recentGames[0].victory ? '#4CAF50' : '#F44336' }
                ]}>
                  {recentGames[0].victory ? '🎉 Victory!' : '💀 Defeated'}
                </Text>
              </View>
            ) : (
              <Text style={styles.noResults}>No recent games</Text>
            )}
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setGameMode('menu')}
            >
              <Text style={styles.actionIcon}>🎮</Text>
              <Text style={styles.actionTitle}>New Training</Text>
              <Text style={styles.actionDesc}>Start another scenario</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('../tabs/toolKit/game-results')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>View Results</Text>
              <Text style={styles.actionDesc}>See all statistics</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.title}>Disaster Training Simulator</Text>
      </View>
      <Text style={styles.subtitle}>
        AI-powered emergency response training with realistic scenarios
      </Text>
      
      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{gameStats.totalGames}</Text>
          <Text style={styles.quickStatLabel}>Games</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{gameStats.victories}</Text>
          <Text style={styles.quickStatLabel}>Wins</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{gameStats.bestScore}</Text>
          <Text style={styles.quickStatLabel}>Best</Text>
        </View>
      </View>

      {/* AI Game Section */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI-Powered Training</Text>
          <Text style={styles.sectionDescription}>
            Dynamic scenarios generated by AI with realistic consequences and adaptive difficulty
          </Text>
          
          <View style={styles.scenariosGrid}>
            {aiScenarios.map((scenario) => (
              <TouchableOpacity
                key={scenario.type}
                style={[
                  styles.scenarioCard,
                  { borderLeftColor: scenario.color }
                ]}
                onPress={() => startAIGame(scenario)}
              >
                <View style={styles.scenarioHeader}>
                  <Text style={styles.scenarioIcon}>{getScenarioIcon(scenario.type)}</Text>
                  <View style={styles.scenarioInfo}>
                    <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                    <Text style={styles.scenarioDesc}>{scenario.description}</Text>
                  </View>
                </View>
                <View style={styles.scenarioFooter}>
                  <Text style={styles.startTrainingText}>Start Training →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        {recentGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
            <View style={styles.recentGames}>
              {recentGames.map((game, index) => (
                <View key={game.id} style={styles.recentGameCard}>
                  <Text style={styles.recentGameScenario}>
                    {getScenarioIcon(game.scenarioType as ScenarioType)} {game.scenarioTitle}
                  </Text>
                  <View style={styles.recentGameStats}>
                    <Text style={styles.recentGameScore}>{game.score} pts</Text>
                    <Text style={[
                      styles.recentGameOutcome,
                      { color: game.victory ? '#4CAF50' : '#F44336' }
                    ]}>
                      {game.victory ? 'Won' : 'Lost'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('../tabs/toolKit/game-results')}
            >
              <Text style={styles.viewAllText}>View All Results →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Training Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Training Tips</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tip}>• Assess the situation before acting</Text>
            <Text style={styles.tip}>• Prioritize life safety over property</Text>
            <Text style={styles.tip}>• Use available resources wisely</Text>
            <Text style={styles.tip}>• Stay calm and make deliberate decisions</Text>
            <Text style={styles.tip}>• Practice different scenarios regularly</Text>
          </View>
        </View>
      </ScrollView>

      {/* Difficulty Selection Modal */}
      <Modal
        visible={showDifficultyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Difficulty</Text>
            <Text style={styles.modalSubtitle}>
              Choose how challenging you want the scenario to be
            </Text>

            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyOption,
                  selectedDifficulty === level && styles.difficultyOptionSelected
                ]}
                onPress={() => setSelectedDifficulty(level)}
              >
                <Text style={styles.difficultyStars}>
                  {getDifficultyStars(level)}
                </Text>
                <Text style={styles.difficultyLabel}>
                  {level === 1 && 'Beginner'}
                  {level === 2 && 'Easy'}
                  {level === 3 && 'Medium'}
                  {level === 4 && 'Hard'}
                  {level === 5 && 'Expert'}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancel}
                onPress={() => setShowDifficultyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirm}
                onPress={confirmAIGame}
              >
                <Text style={styles.modalConfirmText}>Start Training</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
    lineHeight: 20,
  },
  scenariosGrid: {
    gap: 12,
  },
  scenarioCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scenarioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  scenarioDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  scenarioFooter: {
    alignItems: 'flex-end',
  },
  startTrainingText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  recentGames: {
    gap: 8,
  },
  recentGameCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentGameScenario: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  recentGameStats: {
    alignItems: 'flex-end',
  },
  recentGameScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  recentGameOutcome: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 8,
  },
  viewAllText: {
    color: '#3498db',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  tip: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultsContent: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  latestResult: {
    alignItems: 'center',
  },
  latestScenario: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  latestScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 8,
  },
  latestOutcome: {
    fontSize: 18,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  backText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  difficultyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyOptionSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e8',
  },
  difficultyStars: {
    fontSize: 18,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirm: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
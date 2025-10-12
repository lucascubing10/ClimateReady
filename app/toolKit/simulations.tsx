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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Color palette matching your app
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT: [string, string] = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

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
      'evacuation-dash': PRIMARY
    };
    return colors[type];
  };

  const getDifficultyStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '⚪'.repeat(5 - difficulty);
  };

  // Custom Button Component
  const CustomButton = ({ title, onPress, style, variant = 'primary' }: any) => {
    if (variant === 'secondary') {
      return (
        <TouchableOpacity 
          style={[styles.secondaryButton, style]} 
          onPress={onPress}
        >
          <Text style={styles.secondaryButtonText}>{title}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={[styles.primaryButton, style]} 
        onPress={onPress}
      >
        <LinearGradient
          colors={PRIMARY_GRADIENT}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.primaryButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // AI Game Scenarios
  const aiScenarios: { type: ScenarioType; title: string; description: string; color: string }[] = [
    {
      type: 'evacuation-dash',
      title: 'Evacuation Dash',
      description: 'A real-time decision simulator for evacuating from a disaster zone.',
      color: PRIMARY
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
        {/* Background Elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.bgCircle, styles.bgCircle1]} />
          <View style={[styles.bgCircle, styles.bgCircle2]} />
          <View style={[styles.bgCircle, styles.bgCircle3]} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/tabs/toolKit')}>
              <Ionicons name="arrow-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Training Complete</Text>
              <Text style={styles.subtitle}>Great job on your simulation!</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.resultsContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statsCard}>
              <LinearGradient
                colors={["#fff", "#f8fafc"]}
                style={styles.statsGradient}
              >
                <Text style={styles.statsTitle}>Latest Performance</Text>
                {recentGames.length > 0 ? (
                  <View style={styles.latestResult}>
                    <Text style={styles.latestScenario}>
                      {getScenarioIcon(recentGames[0].scenarioType as ScenarioType)} {recentGames[0].scenarioTitle}
                    </Text>
                    <Text style={styles.latestScore}>Score: {recentGames[0].score}</Text>
                    <View style={[
                      styles.outcomeBadge,
                      { backgroundColor: recentGames[0].victory ? '#e8f5e8' : '#fee2e2' }
                    ]}>
                      <Text style={[
                        styles.latestOutcome,
                        { color: recentGames[0].victory ? PRIMARY : '#dc2626' }
                      ]}>
                        {recentGames[0].victory ? '🎉 Victory!' : '💀 Defeated'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noResults}>No recent games</Text>
                )}
              </LinearGradient>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => setGameMode('menu')}
              >
                <LinearGradient
                  colors={["#fff", "#f8fafc"]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>🎮</Text>
                  <Text style={styles.actionTitle}>New Training</Text>
                  <Text style={styles.actionDesc}>Start another scenario</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('../tabs/toolKit/game-results')}
              >
                <LinearGradient
                  colors={["#fff", "#f8fafc"]}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>📊</Text>
                  <Text style={styles.actionTitle}>View Results</Text>
                  <Text style={styles.actionDesc}>See all statistics</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Disaster Training Simulator</Text>
              <Text style={styles.subtitle}>
                AI-powered emergency response training with realistic scenarios
              </Text>
            </View>
          </View>
          {/* Quick Stats */}
          <View style={styles.statsOverview}>
            <LinearGradient
              colors={["#fff", "#f8fafc"]}
              style={styles.statsGradient}
            >
              <View style={styles.statsContent}>
                <View style={styles.stat}>
                  <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}> 
                    <Ionicons name="game-controller" size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.statNumber}>{gameStats.totalGames}</Text>
                  <Text style={styles.statLabel}>Games</Text>
                </View>
                <View style={styles.stat}>
                  <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}> 
                    <Ionicons name="trophy" size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.statNumber}>{gameStats.victories}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.stat}>
                  <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}> 
                    <Ionicons name="star" size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.statNumber}>{gameStats.bestScore}</Text>
                  <Text style={styles.statLabel}>Best</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
          {/* AI Game Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI-Powered Training</Text>
            <Text style={styles.sectionDescription}>
              Dynamic scenarios generated by AI with realistic consequences and adaptive difficulty
            </Text>
            <View style={styles.scenariosGrid}>
              {aiScenarios.map((scenario) => (
                <TouchableOpacity
                  key={scenario.type}
                  style={styles.scenarioCard}
                  onPress={() => startAIGame(scenario)}
                >
                  <LinearGradient
                    colors={["#fff", "#f8fafc"]}
                    style={styles.scenarioGradient}
                  >
                    <View style={styles.scenarioHeader}>
                      <View style={[styles.scenarioIconContainer, { backgroundColor: '#e8f5e8' }]}> 
                        <Text style={styles.scenarioIcon}>{getScenarioIcon(scenario.type)}</Text>
                      </View>
                      <View style={styles.scenarioInfo}>
                        <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                        <Text style={styles.scenarioDesc}>{scenario.description}</Text>
                      </View>
                    </View>
                    <View style={styles.scenarioFooter}>
                      <View style={[styles.startButton, { backgroundColor: PRIMARY }]}> 
                        <Text style={styles.startTrainingText}>Start Training →</Text>
                      </View>
                    </View>
                  </LinearGradient>
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
                    <LinearGradient
                      colors={["#fff", "#f8fafc"]}
                      style={styles.recentGameGradient}
                    >
                      <Text style={styles.recentGameScenario}>
                        {getScenarioIcon(game.scenarioType as ScenarioType)} {game.scenarioTitle}
                      </Text>
                      <View style={styles.recentGameStats}>
                        <Text style={styles.recentGameScore}>{game.score} pts</Text>
                        <View style={[
                          styles.outcomeBadge,
                          { backgroundColor: game.victory ? '#e8f5e8' : '#fee2e2' }
                        ]}>
                          <Text style={[
                            styles.recentGameOutcome,
                            { color: game.victory ? PRIMARY : '#dc2626' }
                          ]}>
                            {game.victory ? 'Won' : 'Lost'}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
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
              <LinearGradient
                colors={["#fff", "#f8fafc"]}
                style={styles.tipsGradient}
              >
                <Text style={styles.tip}>• Assess the situation before acting</Text>
                <Text style={styles.tip}>• Prioritize life safety over property</Text>
                <Text style={styles.tip}>• Use available resources wisely</Text>
                <Text style={styles.tip}>• Stay calm and make deliberate decisions</Text>
                <Text style={styles.tip}>• Practice different scenarios regularly</Text>
              </LinearGradient>
            </View>
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
              <CustomButton
                title="Cancel"
                onPress={() => setShowDifficultyModal(false)}
                variant="secondary"
                style={styles.modalCancel}
              />
              <CustomButton
                title="Start Training"
                onPress={confirmAIGame}
                style={styles.modalConfirm}
              />
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
    backgroundColor: BG,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: PRIMARY,
    top: -150,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: YELLOW,
    bottom: -50,
    left: -50,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: ORANGE,
    top: '30%',
    right: '20%',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  statsOverview: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statsGradient: {
    borderRadius: 24,
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  scenariosGrid: {
    gap: 12,
  },
  scenarioCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scenarioGradient: {
    padding: 16,
    borderRadius: 16,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scenarioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scenarioIcon: {
    fontSize: 18,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  scenarioDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  scenarioFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startTrainingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recentGames: {
    gap: 8,
  },
  recentGameCard: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentGameGradient: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentGameScenario: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  recentGameStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recentGameScore: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
    color: PRIMARY,
    fontWeight: '600',
  },
  tipsCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsGradient: {
    padding: 16,
    borderRadius: 16,
  },
  tip: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultsContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  latestResult: {
    alignItems: 'center',
  },
  latestScenario: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  latestScore: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 8,
  },
  latestOutcome: {
    fontSize: 16,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    borderColor: PRIMARY,
    backgroundColor: '#e8f5e8',
  },
  difficultyStars: {
    fontSize: 18,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancel: {
    flex: 1,
  },
  modalConfirm: {
    flex: 1,
  },
  // Button Styles
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
});
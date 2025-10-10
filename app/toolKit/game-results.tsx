// app/(tabs)/toolkit/game-results.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { GameStorage, GameResult } from '@/utils/gameStorage';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function GameResultsScreen() {
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [highScores, setHighScores] = useState<GameResult[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    victories: 0,
    averageScore: 0,
    bestScore: 0
  });

  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    const [results, scores, statistics] = await Promise.all([
      GameStorage.getGameResults(),
      GameStorage.getHighScores(),
      GameStorage.getStats()
    ]);
    
    setGameResults(results);
    setHighScores(scores);
    setStats(statistics);
  };

  const getScenarioIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      earthquake: '⚡',
      fire: '🔥',
      flood: '🌊',
      hurricane: '🌀',
      medical: '🏥',
      tsunami: '🌊',
      'evacuation-dash': '🏃‍♂️'
    };
    return icons[type] || '🎮';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Training Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Overall Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.victories}</Text>
            <Text style={styles.statLabel}>Victories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.averageScore}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.bestScore}</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
        </View>
      </View>

      {/* High Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 High Scores</Text>
        <ScrollView style={styles.highScoresList} horizontal showsHorizontalScrollIndicator={false}>
          {highScores.map((result, index) => (
            <View key={result.id} style={styles.highScoreCard}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.highScoreScenario}>{getScenarioIcon(result.scenarioType)} {result.scenarioTitle}</Text>
              <Text style={styles.highScore}>{result.score} pts</Text>
              <Text style={styles.highScoreDate}>{formatDate(result.date)}</Text>
              <View style={[
                styles.victoryBadge,
                { backgroundColor: result.victory ? '#4CAF50' : '#F44336' }
              ]}>
                <Text style={styles.victoryText}>
                  {result.victory ? 'VICTORY' : 'DEFEAT'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Recent Games */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Recent Training Sessions</Text>
        <ScrollView style={styles.resultsList}>
          {gameResults.slice(0, 10).map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultScenario}>
                  {getScenarioIcon(result.scenarioType)} {result.scenarioTitle}
                </Text>
                <Text style={[
                  styles.resultOutcome,
                  { color: result.victory ? '#4CAF50' : '#F44336' }
                ]}>
                  {result.victory ? '✅ Victory' : '❌ Defeat'}
                </Text>
              </View>
              
              <View style={styles.resultDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Score</Text>
                  <Text style={styles.detailValue}>{result.score}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Objectives</Text>
                  <Text style={styles.detailValue}>{result.objectivesCompleted}/{result.totalObjectives}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Health</Text>
                  <Text style={styles.detailValue}>{result.healthRemaining}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.resultDate}>{formatDate(result.date)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.playAgainButton}
          onPress={() => router.push('../tabs/toolKit/simulations')}
        >
          <Text style={styles.playAgainText}>🎮 Play Again</Text>
        </TouchableOpacity>
        
        {gameResults.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={async () => {
              await GameStorage.clearAllResults();
              loadGameData();
            }}
          >
            <Text style={styles.clearText}>Clear History</Text>
          </TouchableOpacity>
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
  },
  headerSpacer: {
    width: 60,
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  highScoresList: {
    flexGrow: 0,
  },
  highScoreCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f39c12',
    marginBottom: 8,
  },
  highScoreScenario: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  highScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  highScoreDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  victoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  victoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  resultsList: {
    maxHeight: 400,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultScenario: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultOutcome: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  resultDate: {
    fontSize: 10,
    color: '#999',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  playAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearText: {
    color: '#666',
    fontSize: 14,
  },
});
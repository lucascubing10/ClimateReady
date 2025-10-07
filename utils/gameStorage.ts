// utils/gameStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameResult {
  id: string;
  scenarioTitle: string;
  scenarioType: string;
  score: number;
  victory: boolean;
  timeSpent: number;
  actionsTaken: number;
  healthRemaining: number;
  objectivesCompleted: number;
  totalObjectives: number;
  date: string;
  difficulty: number;
}

export class GameStorage {
  private static readonly STORAGE_KEY = 'disaster_game_results';

  static async saveGameResult(result: Omit<GameResult, 'id'>): Promise<void> {
    try {
      const existingResults = await this.getGameResults();
      const newResult: GameResult = {
        ...result,
        id: Date.now().toString()
      };
      
      const updatedResults = [newResult, ...existingResults];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedResults));
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }

  static async getGameResults(): Promise<GameResult[]> {
    try {
      const results = await AsyncStorage.getItem(this.STORAGE_KEY);
      return results ? JSON.parse(results) : [];
    } catch (error) {
      console.error('Error loading game results:', error);
      return [];
    }
  }

  static async getHighScores(): Promise<GameResult[]> {
    const results = await this.getGameResults();
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  static async getStats(): Promise<{
    totalGames: number;
    victories: number;
    averageScore: number;
    bestScore: number;
  }> {
    const results = await this.getGameResults();
    
    if (results.length === 0) {
      return {
        totalGames: 0,
        victories: 0,
        averageScore: 0,
        bestScore: 0
      };
    }

    const victories = results.filter(r => r.victory).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const bestScore = Math.max(...results.map(r => r.score));

    return {
      totalGames: results.length,
      victories,
      averageScore: Math.round(totalScore / results.length),
      bestScore
    };
  }

  static async clearAllResults(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing game results:', error);
    }
  }
}
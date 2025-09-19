import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_preparedness_progress';

export interface UserProgress {
  level: number;
  points: number;
  percent: number;
  checklists: {
    [categoryId: string]: {
      [itemId: string]: boolean;
    };
  };
  completedCategories: number;
  lastUpdated: string;
}

export const defaultUserProgress: UserProgress = {
  level: 1,
  points: 0,
  percent: 0,
  checklists: {},
  completedCategories: 0,
  lastUpdated: new Date().toISOString(),
};

export const getUserProgress = async (): Promise<UserProgress> => {
  try {
    const storedProgress = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedProgress) {
      return JSON.parse(storedProgress);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUserProgress));
    return defaultUserProgress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return defaultUserProgress;
  }
};

export const updateChecklistItem = async (
  categoryId: string, 
  itemId: string, 
  completed: boolean
): Promise<void> => {
  try {
    const progress = await getUserProgress();
    
    if (!progress.checklists[categoryId]) {
      progress.checklists[categoryId] = {};
    }
    
    progress.checklists[categoryId][itemId] = completed;
    progress.lastUpdated = new Date().toISOString();
    
    // Calculate new progress
    const totalItems = Object.values(progress.checklists).reduce((total, category) => {
      return total + Object.keys(category).length;
    }, 0);
    
    const completedItems = Object.values(progress.checklists).reduce((completed, category) => {
      return completed + Object.values(category).filter(item => item === true).length;
    }, 0);
    
    progress.percent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    progress.points = Math.floor(progress.percent * 10);
    progress.level = Math.floor(progress.points / 100) + 1;
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error updating checklist item:', error);
    throw error;
  }
};
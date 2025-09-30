import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_preparedness_progress';

export interface UserProgress {
  completedItems: string[] | undefined;
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
  completedItems: [],
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
    let progress: UserProgress;
    if (storedProgress) {
      progress = JSON.parse(storedProgress);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUserProgress));
      progress = { ...defaultUserProgress };
    }

    // Recalculate percent and points based on all checklistItems
    const completedItemIds: string[] = [];
    Object.entries(progress.checklists).forEach(([cat, items]) => {
      Object.entries(items).forEach(([id, done]) => {
        if (done) completedItemIds.push(id);
      });
    });
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => completedItemIds.includes(item.id)).length;
    progress.percent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    progress.points = checklistItems.reduce((sum, item) => completedItemIds.includes(item.id) ? sum + (item.points || 0) : sum, 0);
    progress.level = Math.floor(progress.points / 100) + 1;

    return progress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return defaultUserProgress;
  }
};

// Import checklistItems for accurate progress calculation
import { checklistItems } from './checklistData';

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

    // Calculate completed items (all true in checklists)
    const completedItemIds: string[] = [];
    Object.entries(progress.checklists).forEach(([cat, items]) => {
      Object.entries(items).forEach(([id, done]) => {
        if (done) completedItemIds.push(id);
      });
    });

    // Use all checklistItems for total
    const totalItems = checklistItems.length;
    const completedItems = checklistItems.filter(item => completedItemIds.includes(item.id)).length;

    progress.percent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    // Points: sum of points for completed items
    progress.points = checklistItems.reduce((sum, item) => completedItemIds.includes(item.id) ? sum + (item.points || 0) : sum, 0);
    progress.level = Math.floor(progress.points / 100) + 1;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error updating checklist item:', error);
    throw error;
  }
};
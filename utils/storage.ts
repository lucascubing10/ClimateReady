import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_preparedness_progress';

export interface UserProgress {
  checklists: {
    [categoryId: string]: {
      [itemId: string]: boolean;
    };
  };
  completedCategories: number;
  lastUpdated: string;
}

export const defaultUserProgress: UserProgress = {
  checklists: {},
  completedCategories: 0,
  lastUpdated: new Date().toISOString(),
};

// Get user progress from storage
export const getUserProgress = async (): Promise<UserProgress> => {
  try {
    const storedProgress = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedProgress) {
      return JSON.parse(storedProgress);
    }
    // Initialize with default progress if none exists
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUserProgress));
    return defaultUserProgress;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return defaultUserProgress;
  }
};

// Update checklist item status
export const updateChecklistItem = async (
  categoryId: string, 
  itemId: string, 
  completed: boolean
): Promise<void> => {
  try {
    const progress = await getUserProgress();
    
    // Initialize category if it doesn't exist
    if (!progress.checklists[categoryId]) {
      progress.checklists[categoryId] = {};
    }
    
    // Update the item status
    progress.checklists[categoryId][itemId] = completed;
    progress.lastUpdated = new Date().toISOString();
    
    // Check if category is now complete
    const categoryItems = Object.keys(progress.checklists[categoryId]);
    const completedItems = categoryItems.filter(id => progress.checklists[categoryId][id]);
    
    // Update completed categories count
    const allCategories = Object.keys(progress.checklists);
    const completedCategories = allCategories.filter(catId => {
      const catItems = Object.keys(progress.checklists[catId]);
      return catItems.every(itemId => progress.checklists[catId][itemId]);
    });
    
    progress.completedCategories = completedCategories.length;
    
    // Save updated progress
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error updating checklist item:', error);
    throw error;
  }
};

// Reset all progress
export const resetProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUserProgress));
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
};

// Export progress data
export const exportProgress = async (): Promise<string> => {
  const progress = await getUserProgress();
  return JSON.stringify(progress, null, 2);
};
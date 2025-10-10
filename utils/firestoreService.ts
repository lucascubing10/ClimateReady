// utils/firestoreService.ts
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, auth, getUserDocument, updateUserDocument } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistItem, checklistItems } from './checklistData';
import { getEarnedBadges } from './badges';

// Types that match your existing structure
export interface UserProgress {
  userId: string;
  completedItems: string[];
  points: number;
  level: number;
  percent: number;
  checklists: {
    [categoryId: string]: {
      [itemId: string]: boolean;
    };
  };
  completedCategories: number;
  lastUpdated: string;
  badges: string[];
}

export interface CustomChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedTime: number;
  difficulty: string;
  points: number;
  custom: boolean;
  userId: string;
  createdAt: string;
}

export interface ChecklistItemUpdate {
  itemId: string;
  category?: string;
  completed: boolean;
}

class FirestoreService {
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  // User Progress Operations - Store within user document
  async getUserProgress(): Promise<UserProgress> {
    try {
      const userId = this.getCurrentUserId();
      const userDoc = await getUserDocument(userId);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if toolkit progress exists in user document
        if (userData?.toolkitProgress) {
          const progress = userData.toolkitProgress as UserProgress;
          
          // Ensure completedItems is always an array (backward compatibility)
          if (!Array.isArray(progress.completedItems)) {
            progress.completedItems = [];
          }
          
          return progress;
        } else {
          // Create initial progress document within user document
          const initialProgress: UserProgress = {
            userId,
            completedItems: [],
            points: 0,
            level: 1,
            percent: 0,
            checklists: {},
            completedCategories: 0,
            lastUpdated: new Date().toISOString(),
            badges: [],
          };
          
          // Update user document with toolkit progress
          await updateUserDocument(userId, {
            toolkitProgress: initialProgress
          });
          
          return initialProgress;
        }
      } else {
        throw new Error('User document not found');
      }
    } catch (error) {
      console.error('Error getting user progress from Firestore:', error);
      // Fallback to local storage
      return this.getLocalProgress();
    }
  }

  private async getLocalProgress(): Promise<UserProgress> {
    try {
      const storedProgress = await AsyncStorage.getItem('user_preparedness_progress');
      if (storedProgress) {
        const progress = JSON.parse(storedProgress);
        // Ensure completedItems is always an array
        if (!Array.isArray(progress.completedItems)) {
          progress.completedItems = [];
        }
        return {
          ...progress,
          userId: this.getCurrentUserId(),
          badges: progress.badges || [],
        };
      }
    } catch (error) {
      console.error('Error getting local progress:', error);
    }

    // Return default progress
    return {
      userId: this.getCurrentUserId(),
      completedItems: [],
      points: 0,
      level: 1,
      percent: 0,
      checklists: {},
      completedCategories: 0,
      lastUpdated: new Date().toISOString(),
      badges: [],
    };
  }

  async updateChecklistItem(update: ChecklistItemUpdate): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();

      // First get current progress to calculate updates
      const currentProgress = await this.getUserProgress();
      
      // Update checklists structure (your existing format)
      const updatedChecklists = { ...currentProgress.checklists };
      if (!updatedChecklists[update.category || 'general']) {
        updatedChecklists[update.category || 'general'] = {};
      }
      
      if (update.completed) {
        updatedChecklists[update.category || 'general'][update.itemId] = true;
      } else {
        delete updatedChecklists[update.category || 'general'][update.itemId];
      }

      // Calculate completed items from checklists (your existing logic)
      const completedItemIds: string[] = [];
      Object.entries(updatedChecklists).forEach(([cat, items]) => {
        Object.entries(items).forEach(([id, done]) => {
          if (done) completedItemIds.push(id);
        });
      });

      // Calculate points and level (your existing logic)
      const totalItems = checklistItems.length;
      const completedCount = checklistItems.filter(item => completedItemIds.includes(item.id)).length;
      const percent = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;
      const points = checklistItems.reduce((sum, item) => 
        completedItemIds.includes(item.id) ? sum + (item.points || 0) : sum, 0
      );
      const level = Math.floor(points / 100) + 1;

      // Calculate badges
      const badges = getEarnedBadges({ completedItems: completedItemIds, totalPoints: points });

      // Create updated progress
      const updatedProgress: UserProgress = {
          userId,
          completedItems: completedItemIds,
          points,
          level,
          percent,
          checklists: updatedChecklists,
          lastUpdated: new Date().toISOString(),
          badges,
          completedCategories: 0
      };

      // Update Firestore - store within user document
      await updateUserDocument(userId, {
        toolkitProgress: updatedProgress
      });

      // Update local storage as backup
      await AsyncStorage.setItem('user_preparedness_progress', JSON.stringify(updatedProgress));

      return true;
    } catch (error) {
      console.error('Error updating checklist item in Firestore:', error);
      return false;
    }
  }

  // Custom Items Operations - Store within user document as an array
  async getCustomItems(): Promise<CustomChecklistItem[]> {
    try {
      const userId = this.getCurrentUserId();
      const userDoc = await getUserDocument(userId);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if custom items exist in user document
        if (userData?.customChecklistItems && Array.isArray(userData.customChecklistItems)) {
          const customItems = userData.customChecklistItems as CustomChecklistItem[];
          
          // Sort by creation date
          customItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return customItems;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting custom items from Firestore:', error);
      // Fallback to local storage
      return this.getLocalCustomItems();
    }
  }

  private async getLocalCustomItems(): Promise<CustomChecklistItem[]> {
    try {
      const localItemsJson = await AsyncStorage.getItem('customItems');
      if (localItemsJson) {
        const items = JSON.parse(localItemsJson);
        // Ensure all items have required fields
        return items.map((item: any) => ({
          ...item,
          userId: this.getCurrentUserId(),
          createdAt: item.createdAt || new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error getting local custom items:', error);
    }
    return [];
  }

  async saveCustomItem(itemData: Omit<CustomChecklistItem, 'id' | 'userId' | 'createdAt'>): Promise<CustomChecklistItem> {
    try {
      const userId = this.getCurrentUserId();
      
      const newItem: CustomChecklistItem = {
        ...itemData,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString(),
      };

      // Get current custom items
      const currentItems = await this.getCustomItems();
      const updatedItems = [...currentItems, newItem];

      // Update Firestore - store within user document
      await updateUserDocument(userId, {
        customChecklistItems: updatedItems
      });

      // Update local storage as backup
      await AsyncStorage.setItem('customItems', JSON.stringify(updatedItems));

      return newItem;
    } catch (error) {
      console.error('Error saving custom item to Firestore:', error);
      throw error;
    }
  }

  async deleteCustomItem(itemId: string): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      // Get current custom items
      const currentItems = await this.getCustomItems();
      const updatedItems = currentItems.filter(item => item.id !== itemId);

      // Update Firestore
      await updateUserDocument(userId, {
        customChecklistItems: updatedItems
      });

      // Update local storage
      await AsyncStorage.setItem('customItems', JSON.stringify(updatedItems));

      // Also remove from completed items if it was completed
      const progress = await this.getUserProgress();
      if (progress.completedItems.includes(itemId)) {
        await this.updateChecklistItem({
          itemId,
          completed: false,
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting custom item from Firestore:', error);
      return false;
    }
  }

  // Real-time listeners for instant updates
  subscribeToUserProgress(callback: (progress: UserProgress) => void): () => void {
    try {
      const userId = this.getCurrentUserId();
      const userRef = doc(db, 'users', userId);
      
      return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          if (userData?.toolkitProgress) {
            const progress = userData.toolkitProgress as UserProgress;
            // Ensure completedItems is always an array
            if (!Array.isArray(progress.completedItems)) {
              progress.completedItems = [];
            }
            callback(progress);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up progress listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  subscribeToCustomItems(callback: (items: CustomChecklistItem[]) => void): () => void {
    try {
      const userId = this.getCurrentUserId();
      const userRef = doc(db, 'users', userId);
      
      return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          if (userData?.customChecklistItems && Array.isArray(userData.customChecklistItems)) {
            const items = userData.customChecklistItems as CustomChecklistItem[];
            
            // Sort by creation date
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            callback(items);
          } else {
            callback([]);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up custom items listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Migration: Import existing data from AsyncStorage to Firestore
  async migrateLocalDataToFirestore(): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      
      // Migrate user progress
      const localProgress = await this.getLocalProgress();
      if (localProgress.completedItems.length > 0 || localProgress.points > 0) {
        await updateUserDocument(userId, {
          toolkitProgress: localProgress
        });
      }

      // Migrate custom items
      const localCustomItems = await this.getLocalCustomItems();
      if (localCustomItems.length > 0) {
        // Only migrate items that don't already exist in Firestore
        const existingItems = await this.getCustomItems();
        const existingItemIds = new Set(existingItems.map(item => item.id));
        const newItems = localCustomItems.filter(item => !existingItemIds.has(item.id));
        
        if (newItems.length > 0) {
          const allItems = [...existingItems, ...newItems];
          await updateUserDocument(userId, {
            customChecklistItems: allItems
          });
        }
      }

      console.log('Data migration to Firestore completed successfully');
      return true;
    } catch (error) {
      console.error('Error migrating data to Firestore:', error);
      return false;
    }
  }
}

export const firestoreService = new FirestoreService();
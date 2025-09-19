import { UserProgress } from './storage';
import { checklistData } from './checklistData';

// Scoring weights
const SCORING_WEIGHTS = {
  ITEM_COMPLETED: 10,
  CATEGORY_COMPLETED: 50,
  ALL_CATEGORIES_COMPLETED: 200,
};

// Calculate total score based on progress
export const calculateScore = (progress: UserProgress): number => {
  if (!progress || !progress.checklists) return 0;

  let score = 0;

  // Calculate points for completed items
  Object.values(progress.checklists).forEach(category => {
    Object.values(category).forEach(completed => {
      if (completed) {
        score += SCORING_WEIGHTS.ITEM_COMPLETED;
      }
    });
  });

  // Calculate points for completed categories
  const completedCategories = Object.keys(progress.checklists).filter(categoryId => {
    const category = progress.checklists[categoryId];
    const categoryItems = checklistData.find(c => c.id === categoryId)?.items || [];
    return categoryItems.every(item => category[item.id]);
  });

  score += completedCategories.length * SCORING_WEIGHTS.CATEGORY_COMPLETED;

  // Bonus for completing all categories
  if (completedCategories.length === checklistData.length) {
    score += SCORING_WEIGHTS.ALL_CATEGORIES_COMPLETED;
  }

  // Cap score at 1000
  return Math.min(score, 1000);
};

// Calculate progress percentage
export const calculateProgressPercentage = (progress: UserProgress): number => {
  if (!progress || !progress.checklists) return 0;

  let totalItems = 0;
  let completedItems = 0;

  checklistData.forEach(category => {
    totalItems += category.items.length;
    const categoryProgress = progress.checklists[category.id] || {};
    completedItems += Object.values(categoryProgress).filter(Boolean).length;
  });

  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
};

// Get category completion status
export const getCategoryCompletion = (progress: UserProgress, categoryId: string): number => {
  if (!progress || !progress.checklists[categoryId]) return 0;

  const category = checklistData.find(c => c.id === categoryId);
  if (!category) return 0;

  const categoryProgress = progress.checklists[categoryId];
  const completed = category.items.filter(item => categoryProgress[item.id]).length;

  return (completed / category.items.length) * 100;
};

// Unit tests for scoring logic
export const runScoringTests = () => {
  const testProgress: UserProgress = {
    checklists: {
      family: {
        'family-1': true,
        'family-2': true,
        'family-3': false,
        'family-4': false,
      },
      supplies: {
        'supplies-1': true,
        'supplies-2': true,
        'supplies-3': true,
        'supplies-4': false,
      }
    },
    completedCategories: 0,
    lastUpdated: new Date().toISOString(),
  };

  console.log('Scoring tests:');
  console.log('Basic score:', calculateScore(testProgress));
  console.log('Progress percentage:', calculateProgressPercentage(testProgress));
  console.log('Family completion:', getCategoryCompletion(testProgress, 'family'));
  console.log('Supplies completion:', getCategoryCompletion(testProgress, 'supplies'));
};

// Test the scoring logic
// runScoringTests();
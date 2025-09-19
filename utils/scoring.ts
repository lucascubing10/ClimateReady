import { UserProgress } from './storage';
import { checklistData } from './checklistData';

// Calculate total score based on progress (0-100 scale)
export const calculateScore = (progress: UserProgress): number => {
  if (!progress || !progress.checklists) return 0;

  let totalPossiblePoints = 0;
  let earnedPoints = 0;

  // Calculate points for each category
  checklistData.forEach(category => {
    category.items.forEach(item => {
      totalPossiblePoints += item.points;
      
      // Add points if item is completed
      if (progress.checklists[category.id]?.[item.id]) {
        earnedPoints += item.points;
      }
    });
  });

  // Calculate percentage score (0-100)
  const score = totalPossiblePoints > 0 ? (earnedPoints / totalPossiblePoints) * 100 : 0;
  
  return Math.min(score, 100); // Cap at 100
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
  console.log('=== Running Scoring Tests ===');
  
  // Test 1: Empty progress
  const emptyProgress: UserProgress = {
    checklists: {},
    completedCategories: 0,
    lastUpdated: new Date().toISOString(),
  };
  
  console.log('Empty progress score:', calculateScore(emptyProgress));
  console.log('Empty progress percentage:', calculateProgressPercentage(emptyProgress));
  
  // Test 2: Partial progress
  const partialProgress: UserProgress = {
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
  
  console.log('Partial progress score:', calculateScore(partialProgress));
  console.log('Partial progress percentage:', calculateProgressPercentage(partialProgress));
  console.log('Family completion:', getCategoryCompletion(partialProgress, 'family'));
  console.log('Supplies completion:', getCategoryCompletion(partialProgress, 'supplies'));
  
  // Test 3: Full progress
  const fullProgress: UserProgress = {
    checklists: checklistData.reduce((acc, category) => {
      acc[category.id] = category.items.reduce((itemAcc, item) => {
        itemAcc[item.id] = true;
        return itemAcc;
      }, {} as any);
      return acc;
    }, {} as any),
    completedCategories: checklistData.length,
    lastUpdated: new Date().toISOString(),
  };
  
  console.log('Full progress score:', calculateScore(fullProgress));
  console.log('Full progress percentage:', calculateProgressPercentage(fullProgress));
  
  console.log('=== Tests Completed ===');
};

// Uncomment to run tests
// runScoringTests();
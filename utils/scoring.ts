import { UserProgress } from './storage';
import { checklistItems, ChecklistItem } from './checklistData';
// Calculate total score based on progress (0-100 scale)
export const calculateScore = (progress: UserProgress): number => {
  if (!progress || !progress.checklists) return 0;

  let totalPossiblePoints = 0;
  let earnedPoints = 0;

  // Calculate points for each category

  // Group checklistItems by category
  const categoryMap: { [category: string]: ChecklistItem[] } = {};
  checklistItems.forEach((item: ChecklistItem) => {
    if (!categoryMap[item.category]) categoryMap[item.category] = [];
    categoryMap[item.category].push(item);
  });

  Object.entries(categoryMap).forEach(([categoryId, items]) => {
    items.forEach((item: ChecklistItem) => {
      totalPossiblePoints += item.points;
      if (progress.checklists[categoryId]?.[item.id]) {
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


  // Group checklistItems by category
  const categoryMap: { [category: string]: ChecklistItem[] } = {};
  checklistItems.forEach((item: ChecklistItem) => {
    if (!categoryMap[item.category]) categoryMap[item.category] = [];
    categoryMap[item.category].push(item);
  });

  Object.entries(categoryMap).forEach(([categoryId, items]) => {
    totalItems += items.length;
    const categoryProgress = progress.checklists[categoryId] || {};
    completedItems += items.filter((item: ChecklistItem) => categoryProgress[item.id]).length;
  });

  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
};

// Get category completion status
export const getCategoryCompletion = (progress: UserProgress, categoryId: string): number => {
  if (!progress || !progress.checklists[categoryId]) return 0;

  // Group checklistItems by category
  const items = checklistItems.filter((item: ChecklistItem) => item.category === categoryId);
  if (!items.length) return 0;
  const categoryProgress = progress.checklists[categoryId] || {};
  const completed = items.filter((item: ChecklistItem) => categoryProgress[item.id]).length;
  return (completed / items.length) * 100;
};

// Unit tests for scoring logic
export const runScoringTests = () => {
  console.log('=== Running Scoring Tests ===');
  
  // Test 1: Empty progress
  const emptyProgress: UserProgress = {
    completedItems: [],
    level: 1, // User starts at level 1
    points: 0, // No points earned yet
    percent: 0, // 0% completion
    checklists: {},
    completedCategories: 0,
    lastUpdated: new Date().toISOString(),
    totalItems: 0,
    completedLearning: []
  };
  
  console.log('Empty progress score:', calculateScore(emptyProgress));
  console.log('Empty progress percentage:', calculateProgressPercentage(emptyProgress));
  
  // Test 2: Partial progress
  const partialProgress: UserProgress = {
    completedItems: [],
    level: 2, // User has reached level 2
    points: 50, // User has earned 50 points
    percent: 50, // 50% of preparedness tasks completed
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
    totalItems: 0,
    completedLearning: []
  };
  
  console.log('Partial progress score:', calculateScore(partialProgress));
  console.log('Partial progress percentage:', calculateProgressPercentage(partialProgress));
  console.log('Family completion:', getCategoryCompletion(partialProgress, 'family'));
  console.log('Supplies completion:', getCategoryCompletion(partialProgress, 'supplies'));
  
  // Test 3: Full progress
  // For full progress, mark all items as completed by category
  const allCategories = Array.from(new Set(checklistItems.map(item => item.category)));
  const fullChecklists: { [category: string]: { [itemId: string]: boolean } } = {};
  allCategories.forEach(categoryId => {
    fullChecklists[categoryId] = {};
    checklistItems.filter(item => item.category === categoryId).forEach(item => {
      fullChecklists[categoryId][item.id] = true;
    });
  });
  const fullProgress: UserProgress = {
    completedItems: checklistItems.map(item => item.id),
    level: 5, // User has reached maximum level
    points: 100, // User has earned maximum points
    percent: 100, // 100% of preparedness tasks completed
    checklists: fullChecklists,
    completedCategories: allCategories.length,
    lastUpdated: new Date().toISOString(),
    totalItems: 0,
    completedLearning: []
  };
  
  console.log('Full progress score:', calculateScore(fullProgress));
  console.log('Full progress percentage:', calculateProgressPercentage(fullProgress));
  
  console.log('=== Tests Completed ===');
};

// Uncomment to run tests
// runScoringTests();
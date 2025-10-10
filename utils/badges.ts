// utils/badges.ts
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirements: {
    type: 'checklist_completion' | 'points' | 'content_completion' | 'category_mastery';
    target: number;
    category?: string;
  };
  animation?: string;
}

export const badges: Badge[] = [
  {
    id: 'badge-1',
    name: 'Preparedness Beginner',
    description: 'Complete your first 5 checklist items',
    icon: '🎯',
    color: '#FFD700',
    requirements: { type: 'checklist_completion', target: 5 }
  },
  {
    id: 'badge-2',
    name: 'Water Warrior',
    description: 'Complete all water-related checklist items',
    icon: '💧',
    color: '#3498db',
    requirements: { type: 'category_mastery', target: 2, category: 'water' }
  },
  {
    id: 'badge-3',
    name: 'Safety Specialist',
    description: 'Complete all safety and health checklist items',
    icon: '🛡️',
    color: '#e74c3c',
    requirements: { type: 'category_mastery', target: 2, category: 'safety' }
  },
  {
    id: 'badge-4',
    name: 'Family Protector',
    description: 'Complete checklist items for all special needs categories',
    icon: '👨‍👩‍👧‍👦',
    color: '#9b59b6',
    requirements: { type: 'category_mastery', target: 3, category: 'special_needs' }
  },
  {
    id: 'badge-5',
    name: 'Food Preparation Pro',
    description: 'Complete all food-related checklist items',
    icon: '🍎',
    color: '#e67e22',
    requirements: { type: 'category_mastery', target: 2, category: 'food' }
  },
  {
    id: 'badge-6',
    name: 'Health Hero',
    description: 'Complete all health and medical checklist items',
    icon: '🏥',
    color: '#e74c3c',
    requirements: { type: 'category_mastery', target: 2, category: 'health' }
  },
  {
    id: 'badge-7',
    name: 'Preparedness Master',
    description: 'Complete 50% of all checklist items',
    icon: '🏆',
    color: '#f1c40f',
    requirements: { type: 'checklist_completion', target: 10 }
  },
  {
    id: 'badge-8',
    name: 'Emergency Expert',
    description: 'Complete 100% of all checklist items',
    icon: '⭐',
    color: '#e74c3c',
    requirements: { type: 'checklist_completion', target: 20 }
  }
];

// Helper function to calculate earned badges
export const getEarnedBadges = (userProgress: {
  completedItems?: string[];
  totalPoints?: number;
}): string[] => {
  const completedItems = userProgress.completedItems ?? [];
  const earned: string[] = [];

  // Get all checklist items for calculations
  const { checklistItems } = require('./checklistData');
  
  // Badge 1: Complete 5 items
  if (completedItems.length >= 5) {
    earned.push('badge-1');
  }

  // Badge 2: Water items
  const waterItems = checklistItems.filter((item: any) => item.category === 'water').map((item: any) => item.id);
  if (waterItems.length > 0 && waterItems.every((item: string) => completedItems.includes(item))) {
    earned.push('badge-2');
  }

  // Badge 3: Safety items
  const safetyItems = checklistItems.filter((item: any) => item.category === 'safety').map((item: any) => item.id);
  if (
    safetyItems.length > 0 &&
    safetyItems.every((item: string) => completedItems.includes(item))
  ) {
    earned.push('badge-3');
  }

  // Badge 4: Special needs items
  const specialItems = checklistItems.filter((item: any) => item.category === 'special_needs').map((item: any) => item.id);
  if (
    specialItems.length > 0 &&
    specialItems.every((item: string) => completedItems.includes(item))
  ) {
    earned.push('badge-4');
  }

  // Badge 5: Food items
  const foodItems = checklistItems.filter((item: any) => item.category === 'food').map((item: any) => item.id);
  if (
    foodItems.length > 0 &&
    foodItems.every((item: string) => completedItems.includes(item))
  ) {
    earned.push('badge-5');
  }

  // Badge 6: Health items
  const healthItems = checklistItems.filter((item: any) => item.category === 'health').map((item: any) => item.id);
  if (
    healthItems.length > 0 &&
    healthItems.every((item: string) => completedItems.includes(item))
  ) {
    earned.push('badge-6');
  }

  // Badge 7: 50% completion
  const totalItems = checklistItems.length;
  const completionPercentage = (completedItems.length / totalItems) * 100;
  if (completionPercentage >= 50) {
    earned.push('badge-7');
  }

  // Badge 8: 100% completion
  if (completionPercentage >= 100) {
    earned.push('badge-8');
  }

  return earned;
};

// Helper to get badge by ID
export const getBadgeById = (badgeId: string): Badge | undefined => {
  return badges.find(badge => badge.id === badgeId);
};

// Helper to check if user just unlocked a badge
export const getNewlyUnlockedBadges = (oldBadges: string[], newBadges: string[]): Badge[] => {
  const newlyUnlockedIds = newBadges.filter(badgeId => !oldBadges.includes(badgeId));
  return newlyUnlockedIds.map(badgeId => getBadgeById(badgeId)).filter(Boolean) as Badge[];
};
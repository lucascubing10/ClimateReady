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
  }
];

// Helper function to calculate earned badges
export const getEarnedBadges = (userProgress: {
  completedItems?: string[];
  totalPoints?: number;
}): string[] => {
  const completedItems = userProgress.completedItems ?? [];
  const earned: string[] = [];

  // Badge 1: Complete 5 items
  if (completedItems.length >= 5) {
    earned.push('badge-1');
  }

  // Badge 2: Water items (check if all water items are completed)
  const waterItems = ['water-1', 'water-2'];
  if (waterItems.every(item => completedItems.includes(item))) {
    earned.push('badge-2');
  }

  // Badge 3: Safety items
  const safetyItems = ['safety-1', 'safety-2'];
  if (safetyItems.every(item => completedItems.includes(item))) {
    earned.push('badge-3');
  }

  // Badge 4: Special needs items
  const specialItems = ['special-1', 'special-2', 'special-3'];
  if (specialItems.every(item => completedItems.includes(item))) {
    earned.push('badge-4');
  }

  return earned;
};

// Example usage:
getEarnedBadges({
  completedItems: ['water-1', 'water-2', 'safety-1', 'safety-2', 'special-1', 'special-2', 'special-3'],
  totalPoints: 10
});
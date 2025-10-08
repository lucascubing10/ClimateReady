export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'water' | 'food' | 'shelter' | 'safety' | 'communication' | 'health' | 'documents' | 'special_needs';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  resources?: string[];
  customFields?: {
    forElderly?: boolean;
    forChildren?: boolean;
    forPets?: boolean;
    quantity?: number;
    notes?: string;
  };
}

export const checklistItems: ChecklistItem[] = [
  // WATER
  {
    id: 'water-1',
    title: 'Store 1 gallon of water per person per day (3-day supply)',
    description: 'Store at least 3 gallons per person for drinking and sanitation',
    category: 'water',
    priority: 'critical',
    estimatedTime: 30,
    difficulty: 'easy',
    points: 10,
    customFields: { quantity: 3, notes: 'Store in cool, dark place' }
  },
  {
    id: 'water-2',
    title: 'Water purification tablets or filter',
    description: 'Have methods to purify water in case stored water runs out',
    category: 'water',
    priority: 'high',
    estimatedTime: 15,
    difficulty: 'easy',
    points: 8
  },

  // FOOD
  {
    id: 'food-1',
    title: '3-day supply of non-perishable food',
    description: 'Canned goods, dry foods, energy bars that require no cooking',
    category: 'food',
    priority: 'critical',
    estimatedTime: 45,
    difficulty: 'easy',
    points: 15,
    customFields: { forChildren: true, forElderly: true, notes: 'Consider dietary restrictions' }
  },
  {
    id: 'food-2',
    title: 'Manual can opener and utensils',
    description: 'Essential tools for food preparation without electricity',
    category: 'food',
    priority: 'medium',
    estimatedTime: 10,
    difficulty: 'easy',
    points: 5
  },

  // SAFETY & HEALTH
  {
    id: 'safety-1',
    title: 'First aid kit with essential medications',
    description: 'Include bandages, antiseptic, pain relievers, and 7-day medication supply',
    category: 'health',
    priority: 'critical',
    estimatedTime: 20,
    difficulty: 'easy',
    points: 15,
    customFields: { forElderly: true, forChildren: true }
  },
  {
    id: 'safety-2',
    title: 'Emergency lighting (flashlights, glow sticks)',
    description: 'Multiple light sources with extra batteries',
    category: 'safety',
    priority: 'high',
    estimatedTime: 15,
    difficulty: 'easy',
    points: 8
  },

  // SPECIAL NEEDS
  {
    id: 'special-1',
    title: 'Extra medical supplies for elderly family members',
    description: 'Walking aids, hearing aids with extra batteries, oxygen tanks if needed',
    category: 'special_needs',
    priority: 'critical',
    estimatedTime: 30,
    difficulty: 'medium',
    points: 20,
    customFields: { forElderly: true }
  },
  {
    id: 'special-2',
    title: 'Comfort items and activities for children',
    description: 'Favorite toys, books, games to reduce stress during emergencies',
    category: 'special_needs',
    priority: 'medium',
    estimatedTime: 20,
    difficulty: 'easy',
    points: 8,
    customFields: { forChildren: true }
  },
  {
    id: 'special-3',
    title: 'Pet emergency carrier and documents',
    description: 'Carrier, leash, vaccination records, and pet first aid',
    category: 'special_needs',
    priority: 'high',
    estimatedTime: 25,
    difficulty: 'easy',
    points: 10,
    customFields: { forPets: true }
  }
];

export type ChecklistCategoryType = {
  id: string;
  name: string;
  items: Array<{
    id: string;
    label: string;
    completed: boolean;
  }>;
};

const checklistData: ChecklistCategoryType[] = [
  // your checklist data here
];

export default checklistData;
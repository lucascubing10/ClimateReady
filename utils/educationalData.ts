// utils/educationalData.ts
export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'infographic' | 'video' | 'guide' | 'simulation';
  category: 'water' | 'food' | 'safety' | 'health' | 'shelter' | 'general';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  completed: boolean;
  content: string; // URL or text content
  resources: string[];
  tags: string[];
}

export const educationalContent: EducationalContent[] = [
  {
    id: 'edu-1',
    title: 'Emergency Water Purification Methods',
    description: 'Learn how to make water safe to drink in emergency situations',
    type: 'guide',
    category: 'water',
    duration: 5,
    difficulty: 'beginner',
    points: 10,
    completed: false,
    content: 'Step-by-step guide to purifying water using boiling, filtration, and chemical treatment methods...',
    resources: ['https://example.com/water-purification'],
    tags: ['water', 'purification', 'survival']
  },
  {
    id: 'edu-2',
    title: 'Building Your Emergency Food Supply',
    description: 'How to create a 3-day emergency food kit for your family',
    type: 'infographic',
    category: 'food',
    duration: 3,
    difficulty: 'beginner',
    points: 8,
    completed: true,
    content: 'Visual guide showing non-perishable food items, storage tips, and rotation schedules...',
    resources: ['https://example.com/food-supply'],
    tags: ['food', 'storage', 'planning']
  },
  {
    id: 'edu-3',
    title: 'Basic First Aid for Families',
    description: 'Essential first aid techniques every family should know',
    type: 'video',
    category: 'health',
    duration: 10,
    difficulty: 'intermediate',
    points: 15,
    completed: false,
    content: 'Video tutorial covering CPR, wound care, and emergency response procedures...',
    resources: ['https://example.com/first-aid'],
    tags: ['first-aid', 'health', 'emergency']
  },
  {
    id: 'edu-4',
    title: 'Home Fire Safety Checklist',
    description: 'Complete guide to fire prevention and safety in your home',
    type: 'guide',
    category: 'safety',
    duration: 7,
    difficulty: 'beginner',
    points: 12,
    completed: false,
    content: 'Comprehensive checklist for smoke detectors, fire extinguishers, and escape plans...',
    resources: ['https://example.com/fire-safety'],
    tags: ['fire', 'safety', 'home']
  },
  {
    id: 'edu-5',
    title: 'Emergency Communication Plan',
    description: 'Create a family communication plan for disasters',
    type: 'guide',
    category: 'general',
    duration: 8,
    difficulty: 'intermediate',
    points: 10,
    completed: false,
    content: 'How to establish meeting points, emergency contacts, and communication methods...',
    resources: ['https://example.com/communication-plan'],
    tags: ['communication', 'planning', 'family']
  }
];

// Helper function to mark content as completed
export const markContentCompleted = (contentId: string, completedItems: string[]): string[] => {
  if (!completedItems.includes(contentId)) {
    return [...completedItems, contentId];
  }
  return completedItems;
};

// Helper function to calculate educational progress
export const getEducationalProgress = (completedItems: string[]) => {
  const total = educationalContent.length;
  const completed = completedItems.length;
  return {
    completed,
    total,
    percentage: (completed / total) * 100,
    points: completedItems.reduce((sum, id) => {
      const content = educationalContent.find(item => item.id === id);
      return sum + (content?.points || 0);
    }, 0)
  };
};
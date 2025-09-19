export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export const checklistData: ChecklistCategory[] = [
  {
    id: 'family',
    title: 'Family Emergency Plan',
    items: [
      { id: 'family-1', text: 'Identify meeting spots inside and outside your home' },
      { id: 'family-2', text: 'Practice emergency drills with all family members' },
      { id: 'family-3', text: 'Establish an out-of-town contact person' },
      { id: 'family-4', text: 'Plan for family members with special needs' },
    ],
  },
  {
    id: 'supplies',
    title: 'Emergency Supplies Kit',
    items: [
      { id: 'supplies-1', text: '3-day supply of water (1 gallon per person per day)' },
      { id: 'supplies-2', text: 'Non-perishable food (3-day supply)' },
      { id: 'supplies-3', text: 'Manual can opener' },
      { id: 'supplies-4', text: 'First aid kit and medications' },
      { id: 'supplies-5', text: 'Flashlight with extra batteries' },
      { id: 'supplies-6', text: 'Whistle to signal for help' },
    ],
  },
  {
    id: 'documents',
    title: 'Important Documents',
    items: [
      { id: 'documents-1', text: 'Copies of personal identification' },
      { id: 'documents-2', text: 'Insurance policies and bank account records' },
      { id: 'documents-3', text: 'Emergency contact list' },
      { id: 'documents-4', text: 'Map of your area with evacuation routes' },
    ],
  },
  {
    id: 'pets',
    title: 'Pet Preparedness',
    items: [
      { id: 'pets-1', text: 'Pet emergency kit (food, water, meds)' },
      { id: 'pets-2', text: 'Collar with ID tag and leash' },
      { id: 'pets-3', text: 'Carrier for each pet' },
      { id: 'pets-4', text: 'Photo of you with your pet for identification' },
    ],
  },
];

export const badgesData = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first checklist item',
    icon: '🦺',
    earned: true,
  },
  {
    id: '2',
    name: 'Family Planner',
    description: 'Complete all family emergency plan items',
    icon: '👨‍👩‍👧‍👦',
    earned: false,
  },
  {
    id: '3',
    name: 'Supply Master',
    description: 'Complete all emergency supplies checklist',
    icon: '📦',
    earned: false,
  },
  {
    id: '4',
    name: 'Document Pro',
    description: 'Secure all important documents',
    icon: '📄',
    earned: true,
  },
  {
    id: '5',
    name: 'Pet Protector',
    description: 'Complete all pet preparedness items',
    icon: '🐾',
    earned: false,
  },
  {
    id: '6',
    name: 'Preparedness Expert',
    description: 'Complete all checklist categories',
    icon: '🏆',
    earned: false,
  },
];
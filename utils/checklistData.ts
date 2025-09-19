export interface ChecklistItem {
  id: string;
  text: string;
  points: number;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

export const checklistData: ChecklistCategory[] = [
  {
    id: 'family',
    title: 'Family Emergency Plan',
    description: 'Prepare your family for emergencies with a solid plan',
    items: [
      { id: 'family-1', text: 'Identify meeting spots inside and outside your home', points: 10 },
      { id: 'family-2', text: 'Practice emergency drills with all family members', points: 15 },
      { id: 'family-3', text: 'Establish an out-of-town contact person', points: 10 },
      { id: 'family-4', text: 'Plan for family members with special needs', points: 15 },
    ],
  },
  {
    id: 'supplies',
    title: 'Emergency Supplies Kit',
    description: 'Gather essential supplies for emergency situations',
    items: [
      { id: 'supplies-1', text: '3-day supply of water (1 gallon per person per day)', points: 20 },
      { id: 'supplies-2', text: 'Non-perishable food (3-day supply)', points: 15 },
      { id: 'supplies-3', text: 'Manual can opener', points: 5 },
      { id: 'supplies-4', text: 'First aid kit and medications', points: 20 },
      { id: 'supplies-5', text: 'Flashlight with extra batteries', points: 10 },
      { id: 'supplies-6', text: 'Whistle to signal for help', points: 5 },
    ],
  },
  {
    id: 'documents',
    title: 'Important Documents',
    description: 'Secure your important documents and information',
    items: [
      { id: 'documents-1', text: 'Copies of personal identification', points: 10 },
      { id: 'documents-2', text: 'Insurance policies and bank account records', points: 15 },
      { id: 'documents-3', text: 'Emergency contact list', points: 10 },
      { id: 'documents-4', text: 'Map of your area with evacuation routes', points: 10 },
    ],
  },
  {
    id: 'pets',
    title: 'Pet Preparedness',
    description: 'Ensure your pets are prepared for emergencies too',
    items: [
      { id: 'pets-1', text: 'Pet emergency kit (food, water, meds)', points: 15 },
      { id: 'pets-2', text: 'Collar with ID tag and leash', points: 10 },
      { id: 'pets-3', text: 'Carrier for each pet', points: 10 },
      { id: 'pets-4', text: 'Photo of you with your pet for identification', points: 5 },
    ],
  },
];

// Get total possible points
export const getTotalPossiblePoints = (): number => {
  return checklistData.reduce((total, category) => {
    return total + category.items.reduce((categoryTotal, item) => {
      return categoryTotal + item.points;
    }, 0);
  }, 0);
};

// Get category by ID
export const getCategoryById = (categoryId: string): ChecklistCategory | undefined => {
  return checklistData.find(category => category.id === categoryId);
};

// Get item by ID
export const getItemById = (categoryId: string, itemId: string): ChecklistItem | undefined => {
  const category = getCategoryById(categoryId);
  return category?.items.find(item => item.id === itemId);
};
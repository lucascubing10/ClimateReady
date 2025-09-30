// utils/simulationsData.ts
export interface Simulation {
  id: string;
  title: string;
  description: string;
  type: 'earthquake' | 'flood' | 'fire' | 'hurricane' | 'first-aid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  points: number;
  completed: boolean;
  scenario: string;
  steps: string[];
  resources: string[];
}

export const simulations: Simulation[] = [
  {
    id: 'sim-1',
    title: 'Earthquake Safety Drill',
    description: 'Practice "Drop, Cover, and Hold On" in a simulated earthquake scenario',
    type: 'earthquake',
    difficulty: 'beginner',
    duration: 5,
    points: 15,
    completed: true,
    scenario: 'A 6.8 magnitude earthquake strikes while you\'re at home. Practice the safety procedures.',
    steps: [
      'DROP to your hands and knees',
      'COVER your head and neck under sturdy furniture',
      'HOLD ON until shaking stops',
      'Evacuate to safe open area',
      'Check for injuries and damage'
    ],
    resources: ['https://example.com/earthquake-safety']
  },
  {
    id: 'sim-2',
    title: 'Flood Evacuation',
    description: 'Learn proper evacuation procedures during flooding',
    type: 'flood',
    difficulty: 'intermediate',
    duration: 8,
    points: 20,
    completed: false,
    scenario: 'Rising flood waters threaten your neighborhood. Make the right decisions to stay safe.',
    steps: [
      'Move to higher ground immediately',
      'Avoid walking through moving water',
      'Do not drive through flooded areas',
      'Disconnect electrical appliances',
      'Follow evacuation routes'
    ],
    resources: ['https://example.com/flood-safety']
  },
  {
    id: 'sim-3',
    title: 'Home Fire Escape',
    description: 'Practice fire escape planning and execution',
    type: 'fire',
    difficulty: 'beginner',
    duration: 6,
    points: 15,
    completed: false,
    scenario: 'A fire breaks out in your kitchen at night. Navigate to safety.',
    steps: [
      'Test smoke alarms',
      'Crawl low under smoke',
      'Check doors for heat before opening',
      'Use designated escape routes',
      'Meet at family meeting point'
    ],
    resources: ['https://example.com/fire-escape']
  },
  {
    id: 'sim-4',
    title: 'Hurricane Preparedness',
    description: 'Prepare for an approaching hurricane',
    type: 'hurricane',
    difficulty: 'advanced',
    duration: 10,
    points: 25,
    completed: false,
    scenario: 'A category 3 hurricane is approaching your coastal town. Make critical preparation decisions.',
    steps: [
      'Secure outdoor objects',
      'Board up windows',
      'Prepare emergency supplies',
      'Identify evacuation zone',
      'Monitor emergency broadcasts'
    ],
    resources: ['https://example.com/hurricane-prep']
  }
];

export const markSimulationCompleted = (simulationId: string, completedSimulations: string[]): string[] => {
  if (!completedSimulations.includes(simulationId)) {
    return [...completedSimulations, simulationId];
  }
  return completedSimulations;
};

export const getSimulationProgress = (completedSimulations: string[]) => {
  const total = simulations.length;
  const completed = completedSimulations.length;
  return {
    completed,
    total,
    percentage: (completed / total) * 100,
    points: completedSimulations.reduce((sum, id) => {
      const sim = simulations.find(item => item.id === id);
      return sum + (sim?.points || 0);
    }, 0)
  };
};
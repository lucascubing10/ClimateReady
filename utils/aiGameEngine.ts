// utils/aiGameEngine.ts

export interface GameScenario {
  id: string;
  type: 'earthquake' | 'fire' | 'flood' | 'hurricane' | 'medical';
  title: string;
  description: string;
  initialSituation: string;
  environment: string;
  timePressure: number; // seconds
  difficulty: number; // 1-5
  objectives: string[];
  hazards: string[];
  availableResources: string[];
}

export interface GameState {
  scenario: GameScenario;
  currentSituation: string;
  userActions: GameAction[];
  timeRemaining: number;
  health: number; // 0-100
  resources: string[];
  completedObjectives: string[];
  score: number;
  gameOver: boolean;
  victory: boolean;
}

export interface GameAction {
  id: string;
  description: string;
  type: 'move' | 'use' | 'communicate' | 'wait' | 'evacuate';
  target?: string;
  resourceCost?: string[];
  timeCost: number;
  successProbability: number;
  consequences: ActionConsequence[];
}

export interface ActionConsequence {
  description: string;
  probability: number;
  healthChange: number;
  resourceChange: string[];
  situationChange: string;
  objectiveProgress?: string;
}

// AI Scenario Generator
export class AIGameEngine {
  private scenarios: GameScenario[] = [
    {
      id: 'earthquake-office',
      type: 'earthquake',
      title: 'Office Building Quake',
      description: 'A major earthquake strikes while you\'re in a high-rise office building',
      initialSituation: 'You\'re on the 15th floor when violent shaking begins. Lights flicker, furniture slides across the floor. The building groans ominously.',
      environment: 'modern office, multiple floors, glass windows, emergency exits',
      timePressure: 180,
      difficulty: 3,
      objectives: [
        'Protect yourself from falling debris',
        'Evacuate to safe open area',
        'Account for coworkers',
        'Avoid glass hazards'
      ],
      hazards: [
        'falling ceiling tiles',
        'broken glass',
        'collapsing furniture',
        'power outage',
        'aftershocks'
      ],
      availableResources: [
        'office desk',
        'emergency flashlight',
        'first aid kit',
        'emergency exit map',
        'cell phone'
      ]
    },
    {
      id: 'apartment-fire',
      type: 'fire',
      title: 'Apartment Building Fire',
      description: 'A fire breaks out in your apartment building at night',
      initialSituation: 'You wake up to smoke alarms and the smell of smoke. The hallway is filling with smoke, and you hear distant screams.',
      environment: 'apartment building, multiple units, smoke-filled corridors, emergency stairs',
      timePressure: 120,
      difficulty: 4,
      objectives: [
        'Alert neighbors',
        'Evacuate safely',
        'Avoid smoke inhalation',
        'Call emergency services'
      ],
      hazards: [
        'thick smoke',
        'intense heat',
        'blocked exits',
        'panic',
        'structural collapse'
      ],
      availableResources: [
        'wet towel',
        'flashlight',
        'cell phone',
        'fire extinguisher',
        'emergency ladder'
      ]
    }
  ];
  getScenarioByType: any;

  // AI Decision Evaluator
  evaluateAction(action: GameAction, currentState: GameState): {
    success: boolean;
    consequence: ActionConsequence;
    newState: GameState;
  } {
    // Calculate success based on probability and current conditions
    const successRoll = Math.random();
    const success = successRoll <= action.successProbability * this.getDifficultyMultiplier(currentState);
    
    // Select appropriate consequence
    const consequence = success ? 
      action.consequences.find(c => c.probability >= 0.7) || action.consequences[0] :
      action.consequences.find(c => c.probability <= 0.3) || action.consequences[action.consequences.length - 1];

    // Update game state
    const newState: GameState = {
      ...currentState,
      timeRemaining: Math.max(0, currentState.timeRemaining - action.timeCost),
      health: Math.max(0, Math.min(100, currentState.health + (consequence.healthChange || 0))),
      resources: [...currentState.resources],
      currentSituation: consequence.situationChange || currentState.currentSituation,
      userActions: [...currentState.userActions, action],
      score: currentState.score + (success ? 10 : -5)
    };

    // Handle resource changes
    if (action.resourceCost) {
      action.resourceCost.forEach(resource => {
        const index = newState.resources.indexOf(resource);
        if (index > -1) {
          newState.resources.splice(index, 1);
        }
      });
    }
    if (consequence.resourceChange) {
      newState.resources.push(...consequence.resourceChange);
    }

    // Check for game over conditions
    if (newState.health <= 0 || newState.timeRemaining <= 0) {
      newState.gameOver = true;
      newState.victory = false;
    }

    // Check for victory conditions
    const allObjectivesCompleted = currentState.scenario.objectives.every(obj => 
      newState.completedObjectives.includes(obj)
    );
    if (allObjectivesCompleted && newState.health > 0) {
      newState.victory = true;
      newState.gameOver = true;
      newState.score += 100; // Bonus for completing all objectives
    }

    return { success, consequence, newState };
  }

  private getDifficultyMultiplier(state: GameState): number {
    return 1 - (state.scenario.difficulty * 0.1);
  }

  // AI Action Generator - Creates context-aware actions based on current situation
  generateAvailableActions(state: GameState): GameAction[] {
    const baseActions: GameAction[] = [
      {
        id: 'wait-assess',
        description: 'Wait and assess the situation',
        type: 'wait',
        timeCost: 10,
        successProbability: 0.9,
        consequences: [
          {
            description: 'You take a moment to observe your surroundings and identify hazards',
            probability: 0.8,
            healthChange: 0,
            resourceChange: [],
            situationChange: `${state.currentSituation} You notice more details about your environment.`
          }
        ]
      },
      {
        id: 'call-emergency',
        description: 'Call emergency services',
        type: 'communicate',
        timeCost: 30,
        successProbability: 0.7,
        consequences: [
          {
            description: 'You successfully contact emergency services and provide your location',
            probability: 0.7,
            healthChange: 5,
            resourceChange: [],
            situationChange: `${state.currentSituation} Help is on the way, but you need to survive until they arrive.`,
            objectiveProgress: 'Call emergency services'
          }
        ]
      }
    ];

    // Scenario-specific actions
    const scenarioActions = this.generateScenarioSpecificActions(state);
    
    return [...baseActions, ...scenarioActions];
  }

  private generateScenarioSpecificActions(state: GameState): GameAction[] {
    const actions: GameAction[] = [];
    
    if (state.scenario.type === 'earthquake') {
      actions.push(
        {
          id: 'drop-cover-hold',
          description: 'Drop, cover, and hold on under sturdy furniture',
          type: 'use',
          target: 'desk',
          timeCost: 5,
          successProbability: 0.95,
          consequences: [
            {
              description: 'You successfully protect yourself from falling debris during the shaking',
              probability: 0.9,
              healthChange: 10,
              resourceChange: [],
              situationChange: 'The shaking continues but you are protected under sturdy furniture.',
              objectiveProgress: 'Protect yourself from falling debris'
            }
          ]
        },
        {
          id: 'evacuate-building',
          description: 'Begin evacuating the building using emergency exits',
          type: 'evacuate',
          timeCost: 60,
          successProbability: 0.6,
          consequences: [
            {
              description: 'You carefully navigate through damaged areas and reach lower floors safely',
              probability: 0.6,
              healthChange: 15,
              resourceChange: [],
              situationChange: 'You are making progress down the emergency stairs. Watch for hazards.',
              objectiveProgress: 'Evacuate to safe open area'
            },
            {
              description: 'You encounter blocked exits and have to find alternative routes',
              probability: 0.4,
              healthChange: -10,
              resourceChange: [],
              situationChange: 'The main exit is blocked by debris. You need to find another way out.'
            }
          ]
        }
      );
    }

    if (state.scenario.type === 'fire') {
      actions.push(
        {
          id: 'check-door-heat',
          description: 'Check door for heat before opening',
          type: 'use',
          target: 'door',
          timeCost: 5,
          successProbability: 0.9,
          consequences: [
            {
              description: 'The door is cool to touch. It should be safe to proceed.',
              probability: 0.7,
              healthChange: 5,
              resourceChange: [],
              situationChange: 'The door is safe to open. You can proceed to evacuation.'
            },
            {
              description: 'The door is hot! There must be fire on the other side.',
              probability: 0.3,
              healthChange: 0,
              resourceChange: [],
              situationChange: 'The door is dangerously hot. You need to find an alternative escape route.'
            }
          ]
        },
        {
          id: 'crawl-under-smoke',
          description: 'Crawl low under smoke to avoid inhalation',
          type: 'move',
          timeCost: 15,
          successProbability: 0.8,
          consequences: [
            {
              description: 'You successfully navigate under the smoke layer where air is clearer',
              probability: 0.8,
              healthChange: 10,
              resourceChange: [],
              situationChange: 'Staying low helps you breathe better as you move toward safety.',
              objectiveProgress: 'Avoid smoke inhalation'
            }
          ]
        }
      );
    }

    return actions;
  }

  // AI Narrative Generator - Creates dynamic story progression
  generateNarrativeUpdate(state: GameState, action: GameAction, consequence: ActionConsequence): string {
    const intensityWords = ['suddenly', 'without warning', 'abruptly', 'violently'];
    const hazardEvents = [
      'A loud crash echoes from nearby',
      'The building shudders ominously',
      'Smoke thickens dramatically',
      'Screams echo through the corridors'
    ];
    
    const randomIntensity = intensityWords[Math.floor(Math.random() * intensityWords.length)];
    const randomHazard = hazardEvents[Math.floor(Math.random() * hazardEvents.length)];
    
    return `${consequence.description} ${randomIntensity}, ${randomHazard}.`;
  }

  getRandomScenario(): GameScenario {
    return this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
  }

  initializeGameState(scenario: GameScenario): GameState {
    return {
      scenario,
      currentSituation: scenario.initialSituation,
      userActions: [],
      timeRemaining: scenario.timePressure,
      health: 100,
      resources: [...scenario.availableResources],
      completedObjectives: [],
      score: 0,
      gameOver: false,
      victory: false
    };
  }
}
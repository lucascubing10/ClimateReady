// components/game/EnhancedDisasterGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Vibration, Easing, ActivityIndicator
} from 'react-native';
import { GeminiService, ScenarioResponse } from '../../utils/geminiService';
import { GameStorage, GameResult } from '../../utils/gameStorage';

const { width, height } = Dimensions.get('window');

interface EnhancedDisasterGameProps {
  scenarioType: string;
  difficulty: number;
  onGameEnd: () => void;
  onExit: () => void;
}

export const EnhancedDisasterGame: React.FC<EnhancedDisasterGameProps> = ({
  scenarioType,
  difficulty,
  onGameEnd,
  onExit
}) => {
  const [gameState, setGameState] = useState<'loading' | 'intro' | 'playing' | 'victory' | 'defeat'>('loading');
  const [scenario, setScenario] = useState<ScenarioResponse | null>(null);
  const [currentSituation, setCurrentSituation] = useState('');
  const [health, setHealth] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [completedObjectives, setCompletedObjectives] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  const geminiService = useRef(new GeminiService('YOUR_API_KEY_HERE')).current;
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const healthAnim = useRef(new Animated.Value(100)).current;
  const timeAnim = useRef(new Animated.Value(100)).current;

  // Fallback scenarios in case Gemini API fails
  const fallbackScenarios = {
    earthquake: {
      id: 'earthquake-fallback',
      title: "Office Building Earthquake",
      description: "A major earthquake strikes while you're working in a high-rise office building",
      initialSituation: "You're on the 12th floor when violent shaking begins. Computers fall, ceiling tiles drop, and the building sways dangerously. Emergency lights flicker on.",
      environment: "Modern office building with glass walls, emergency exits, and multiple floors",
      objectives: ["Protect yourself from falling debris", "Evacuate to safety", "Help coworkers if possible"],
      hazards: ["Falling objects", "Broken glass", "Structural damage", "Aftershocks"],
      availableResources: ["Office desk", "Emergency flashlight", "First aid kit", "Cell phone"],
      timePressure: 180,
      difficulty: difficulty,
      scenarioType: "earthquake" as const
    },
    fire: {
      id: 'fire-fallback',
      title: "Apartment Building Fire",
      description: "A fire breaks out in your apartment building while you're sleeping",
      initialSituation: "You wake up to smoke alarms and the smell of smoke. Your room is filling with smoke, and you hear crackling from the hallway.",
      environment: "Residential apartment building with smoke-filled corridors and emergency exits",
      objectives: ["Evacuate safely", "Avoid smoke inhalation", "Alert neighbors", "Call for help"],
      hazards: ["Thick smoke", "Intense heat", "Blocked exits", "Panic"],
      availableResources: ["Wet towel", "Flashlight", "Cell phone", "Emergency ladder"],
      timePressure: 120,
      difficulty: difficulty,
      scenarioType: "fire" as const
    },
    flood: {
      id: 'flood-fallback',
      title: "Flash Flood Emergency",
      description: "Rising flood waters threaten your neighborhood during heavy rainfall",
      initialSituation: "Heavy rain has been falling for hours. Water is rapidly rising around your home, and emergency alerts warn of flash flooding.",
      environment: "Residential neighborhood with rising water, flooded streets, and limited escape routes",
      objectives: ["Move to higher ground", "Avoid flood waters", "Secure important items", "Evacuate if necessary"],
      hazards: ["Rising water", "Strong currents", "Electrical hazards", "Contaminated water"],
      availableResources: ["Life jackets", "Emergency radio", "Waterproof bags", "Cell phone"],
      timePressure: 150,
      difficulty: difficulty,
      scenarioType: "flood" as const
    },
    hurricane: {
      id: 'hurricane-fallback',
      title: "Hurricane Preparedness",
      description: "A major hurricane is approaching your coastal town",
      initialSituation: "Hurricane warnings are in effect. Strong winds and heavy rain are beginning, with the storm expected to intensify.",
      environment: "Coastal town with evacuations, storm surge risk, and power outages",
      objectives: ["Secure your home", "Prepare emergency supplies", "Evacuate if ordered", "Stay informed"],
      hazards: ["High winds", "Storm surge", "Flooding", "Power outages"],
      availableResources: ["Emergency kit", "Battery radio", "Plywood", "Cell phone"],
      timePressure: 200,
      difficulty: difficulty,
      scenarioType: "hurricane" as const
    },
    medical: {
      id: 'medical-fallback',
      title: "Emergency First Aid",
      description: "A family member has a medical emergency at home",
      initialSituation: "Your family member suddenly collapses and is unresponsive. You need to provide immediate assistance while waiting for emergency services.",
      environment: "Home environment with limited medical supplies",
      objectives: ["Assess the situation", "Provide basic first aid", "Call for help", "Monitor vital signs"],
      hazards: ["Unconsciousness", "Bleeding", "Breathing difficulties", "Shock"],
      availableResources: ["First aid kit", "Phone", "Blankets", "Medications"],
      timePressure: 180,
      difficulty: difficulty,
      scenarioType: "medical" as const
    },
    tsunami: {
      id: 'tsunami-fallback',
      title: "Tsunami Evacuation",
      description: "A tsunami warning has been issued for your coastal area",
      initialSituation: "Earthquake tremors are followed by tsunami warnings. You have limited time to evacuate to higher ground before waves hit.",
      environment: "Coastal area with evacuation routes and high ground",
      objectives: ["Evacuate immediately", "Move to high ground", "Avoid coastal areas", "Stay informed"],
      hazards: ["Large waves", "Strong currents", "Debris", "Flooding"],
      availableResources: ["Emergency bag", "Weather radio", "Maps", "Cell phone"],
      timePressure: 120,
      difficulty: difficulty,
      scenarioType: "tsunami" as const
    }
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      startGameTimer();
      startPulseAnimation();
    }
  }, [gameState]);

  const initializeGame = async () => {
    try {
      setGameState('loading');
      
      // Use fallback scenario for now to avoid API issues
      const fallbackScenario = fallbackScenarios[scenarioType as keyof typeof fallbackScenarios] || fallbackScenarios.earthquake;
      
      setScenario(fallbackScenario);
      setCurrentSituation(fallbackScenario.initialSituation);
      setTimeRemaining(fallbackScenario.timePressure);
      setObjectives(fallbackScenario.objectives || []);
      setResources(fallbackScenario.availableResources || []);
      
      // Generate initial actions
      const actions = generateFallbackActions(scenarioType);
      setAvailableActions(actions);
      
      // Animate intro
      await animateIntro();
      
    } catch (error) {
      console.error('Error initializing game:', error);
      // Ultimate fallback
      const ultimateFallback = fallbackScenarios.earthquake;
      setScenario(ultimateFallback);
      setCurrentSituation(ultimateFallback.initialSituation);
      setTimeRemaining(ultimateFallback.timePressure);
      setObjectives(ultimateFallback.objectives);
      setResources(ultimateFallback.availableResources);
      setAvailableActions(generateFallbackActions('earthquake'));
      setGameState('intro');
    }
  };

  const generateFallbackActions = (type: string): string[] => {
    const actionTemplates = {
      earthquake: [
        "Drop, cover, and hold on under sturdy furniture",
        "Move away from windows and glass",
        "Evacuate using emergency stairs",
        "Check for injuries on yourself and others",
        "Grab emergency supplies"
      ],
      fire: [
        "Check door for heat before opening",
        "Crawl low under smoke",
        "Use wet cloth to cover mouth",
        "Signal for help from window",
        "Use fire extinguisher if safe"
      ],
      flood: [
        "Move to higher ground immediately",
        "Avoid walking through moving water",
        "Turn off electricity at main switch",
        "Secure important documents",
        "Evacuate to designated shelter"
      ],
      hurricane: [
        "Secure windows and doors",
        "Move to safe room or shelter",
        "Monitor emergency broadcasts",
        "Prepare emergency supplies",
        "Evacuate if ordered"
      ],
      medical: [
        "Check responsiveness and breathing",
        "Call emergency services",
        "Perform CPR if trained",
        "Control bleeding if present",
        "Keep person warm and comfortable"
      ],
      tsunami: [
        "Move to high ground immediately",
        "Follow evacuation routes",
        "Avoid coastal areas",
        "Stay tuned to emergency alerts",
        "Help others if safe to do so"
      ]
    };

    return actionTemplates[type as keyof typeof actionTemplates] || actionTemplates.earthquake;
  };

  const animateIntro = (): Promise<void> => {
    return new Promise((resolve) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start(() => {
        setGameState('intro');
        resolve();
      });
    });
  };

  const startGame = () => {
    setGameState('playing');
    setGameLog(prev => [...prev, "🚨 EMERGENCY BEGINS! Make quick decisions!"]);
  };

  const startGameTimer = () => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame(false, 'Time ran out!');
          return 0;
        }
        
        // Update time animation
        const totalTime = scenario?.timePressure || 180;
        timeAnim.setValue((prev / totalTime) * 100);
        
        return prev - 1;
      });
    }, 1000);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleAction = async (action: string) => {
    if (gameState !== 'playing') return;

    // Add action to log
    setGameLog(prev => [...prev, `▶️ ${action}`]);

    // Generate consequence (simulated for now)
    const consequence = generateFallbackConsequence(action, scenarioType);
    
    // Update game state based on consequence
    setHealth(prev => {
      const newHealth = Math.max(0, Math.min(100, prev + consequence.healthChange));
      healthAnim.setValue(newHealth);
      return newHealth;
    });

    setCurrentSituation(consequence.situationChange);
    setScore(prev => prev + (consequence.success ? 15 : 5));

    // Add consequence to log
    setGameLog(prev => [...prev, `➡️ ${consequence.description}`]);

    // Check for objective completion
    checkObjectiveCompletion(action, consequence);

    // Visual feedback
    if (consequence.healthChange < 0) {
      triggerShakeAnimation();
      Vibration.vibrate(400);
    } else if (consequence.success) {
      Vibration.vibrate(100);
    }

    // Check game end conditions
    if (health + consequence.healthChange <= 0) {
      endGame(false, 'Health reached zero!');
    } else if (completedObjectives.length === objectives.length) {
      endGame(true, 'All objectives completed!');
    }
  };

  const generateFallbackConsequence = (action: string, type: string): {
    description: string;
    healthChange: number;
    situationChange: string;
    success: boolean;
  } => {
    // Simple consequence logic based on action type
    const positiveActions = [
      "drop, cover, and hold on",
      "move away from windows",
      "check door for heat",
      "crawl low under smoke",
      "move to higher ground",
      "avoid walking through water",
      "secure windows",
      "check responsiveness",
      "call emergency",
      "perform cpr",
      "control bleeding",
      "follow evacuation",
      "stay tuned",
      "help others"
    ];

    const isPositive = positiveActions.some(positiveAction => 
      action.toLowerCase().includes(positiveAction)
    );

    const baseSituation = currentSituation;
    
    if (isPositive) {
      return {
        description: "Good decision! This action follows emergency safety protocols.",
        healthChange: 5,
        situationChange: `${baseSituation} Your quick thinking improves the situation.`,
        success: true
      };
    } else {
      return {
        description: "Risky move! Consider following established emergency procedures.",
        healthChange: -10,
        situationChange: `${baseSituation} The situation becomes more dangerous.`,
        success: false
      };
    }
  };

  const checkObjectiveCompletion = (action: string, consequence: any) => {
    // Safely check objectives with null checks
    const safeObjectives = objectives || [];
    safeObjectives.forEach(objective => {
      const firstWord = objective.split(' ')[0]?.toLowerCase() || '';
      if (action.toLowerCase().includes(firstWord) && consequence.success) {
        if (!completedObjectives.includes(objective)) {
          setCompletedObjectives(prev => [...prev, objective]);
          setScore(prev => prev + 25); // Bonus for objective completion
          setGameLog(prev => [...prev, `🎯 OBJECTIVE COMPLETED: ${objective}`]);
        }
      }
    });
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const endGame = async (victory: boolean, message: string) => {
    setGameState(victory ? 'victory' : 'defeat');
    
    // Save game result
    const gameResult: Omit<GameResult, 'id'> = {
      scenarioTitle: scenario?.title || 'Unknown Scenario',
      scenarioType: scenarioType,
      score: score + (victory ? 100 : 0) + (timeRemaining * 2),
      victory,
      timeSpent: (scenario?.timePressure || 180) - timeRemaining,
      actionsTaken: gameLog.filter(log => log.startsWith('▶️')).length,
      healthRemaining: health,
      objectivesCompleted: completedObjectives.length,
      totalObjectives: objectives.length,
      date: new Date().toISOString(),
      difficulty: difficulty
    };

    await GameStorage.saveGameResult(gameResult);

    // Add final message to log
    setGameLog(prev => [...prev, `🏁 ${message}`]);
  };

  const getScenarioColor = () => {
    const colors = {
      earthquake: '#8B4513',
      fire: '#FF6B35',
      flood: '#3498db',
      hurricane: '#2980b9',
      medical: '#e74c3c',
      tsunami: '#1abc9c'
    };
    return colors[scenarioType as keyof typeof colors] || '#8B4513';
  };

  // Safe rendering functions with null checks
  const renderObjectives = () => {
    const safeObjectives = objectives || [];
    if (safeObjectives.length === 0) {
      return <Text style={styles.noObjectives}>No objectives available</Text>;
    }

    return (
      <View style={styles.objectivesGrid}>
        {safeObjectives.map((objective, index) => (
          <View key={index} style={styles.objectiveItem}>
            <Text style={[
              styles.objectiveText,
              completedObjectives.includes(objective) && styles.objectiveCompleted
            ]}>
              {completedObjectives.includes(objective) ? '✅' : '🎯'} {objective}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderResources = () => {
    const safeResources = resources || [];
    if (safeResources.length === 0) {
      return <Text style={styles.noResources}>No resources available</Text>;
    }

    return safeResources.map((resource, index) => (
      <Text key={index} style={styles.resourceItem}>🛡️ {resource}</Text>
    ));
  };

  const renderActions = () => {
    const safeActions = availableActions || [];
    if (safeActions.length === 0) {
      return <Text style={styles.noActions}>No actions available</Text>;
    }

    return safeActions.map((action, index) => (
      <TouchableOpacity
        key={index}
        style={styles.actionButton}
        onPress={() => handleAction(action)}
      >
        <Text style={styles.actionText}>{action}</Text>
      </TouchableOpacity>
    ));
  };

  if (gameState === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: getScenarioColor() }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Generating Emergency Scenario...</Text>
          <Text style={styles.loadingSubtext}>Preparing your training session</Text>
        </View>
      </View>
    );
  }

  if (gameState === 'intro' && scenario) {
    return (
      <View style={[styles.container, { backgroundColor: getScenarioColor() }]}>
        <View style={styles.overlay}>
          <Animated.View style={[
            styles.introContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>
            <Text style={styles.scenarioDescription}>{scenario.description}</Text>
            
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {'⭐'.repeat(difficulty)}{'⚪'.repeat(5 - difficulty)} Difficulty
              </Text>
            </View>

            <View style={styles.objectivesList}>
              <Text style={styles.objectivesTitle}>MISSION OBJECTIVES:</Text>
              {renderObjectives()}
            </View>

            <View style={styles.resourcesList}>
              <Text style={styles.resourcesTitle}>AVAILABLE RESOURCES:</Text>
              {renderResources()}
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>START TRAINING</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (gameState === 'victory' || gameState === 'defeat') {
    return (
      <View style={[styles.container, { backgroundColor: getScenarioColor() }]}>
        <View style={styles.overlay}>
          <Animated.View style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}>
            <Text style={[
              styles.resultTitle,
              { color: gameState === 'victory' ? '#4CAF50' : '#F44336' }
            ]}>
              {gameState === 'victory' ? '🎉 MISSION SUCCESS!' : '💀 MISSION FAILED'}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>SCORE</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{completedObjectives.length}/{objectives.length}</Text>
                <Text style={styles.statLabel}>OBJECTIVES</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{health}%</Text>
                <Text style={styles.statLabel}>HEALTH</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.floor(((scenario?.timePressure || 180) - timeRemaining) / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={onGameEnd}>
              <Text style={styles.continueButtonText}>VIEW RESULTS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getScenarioColor() }]}>
      <View style={styles.overlay}>
        {/* Header */}
        <Animated.View style={[
          styles.header,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          <TouchableOpacity style={styles.exitButton} onPress={onExit}>
            <Text style={styles.exitText}>🚪</Text>
          </TouchableOpacity>
          
          <View style={styles.healthTimeContainer}>
            <View style={styles.healthBarContainer}>
              <Text style={styles.barLabel}>HEALTH</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[
                  styles.healthBar,
                  { 
                    width: healthAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: health > 30 ? '#4CAF50' : '#F44336'
                  }
                ]} />
              </View>
              <Text style={styles.barValue}>{health}%</Text>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.barLabel}>TIME</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[
                  styles.timeBar,
                  { 
                    width: timeAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} />
              </View>
              <Text style={styles.barValue}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.barLabel}>SCORE</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Current Situation */}
        <Animated.View style={[
          styles.situationCard,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <Text style={styles.situationTitle}>CURRENT SITUATION</Text>
          <Text style={styles.situationText}>{currentSituation}</Text>
        </Animated.View>

        {/* Objectives */}
        <View style={styles.objectivesCard}>
          <Text style={styles.objectivesTitle}>OBJECTIVES</Text>
          {renderObjectives()}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {renderActions()}
          </View>
        </View>

        {/* Game Log */}
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>EVENT LOG</Text>
          <Animated.ScrollView style={styles.logScroll}>
            {gameLog.map((log, index) => (
              <Text key={index} style={[
                styles.logEntry,
                log.startsWith('▶️') && styles.logAction,
                log.startsWith('➡️') && styles.logConsequence,
                log.startsWith('🎯') && styles.logObjective,
                log.startsWith('🏁') && styles.logFinal
              ]}>
                {log}
              </Text>
            ))}
          </Animated.ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  introContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    marginTop: 40,
    alignItems: 'center',
  },
  scenarioTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  scenarioDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  difficultyBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  difficultyText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  objectivesList: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  objectivesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  objectivesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  objectiveItem: {
    flexBasis: '48%',
  },
  objectiveText: {
    color: '#2c3e50',
    fontSize: 10,
    lineHeight: 14,
  },
  objectiveCompleted: {
    color: '#27ae60',
    fontWeight: '600',
  },
  noObjectives: {
    color: '#7f8c8d',
    fontSize: 12,
    fontStyle: 'italic',
  },
  resourcesList: {
    alignSelf: 'stretch',
    marginBottom: 30,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  resourceItem: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 6,
  },
  noResources: {
    color: '#7f8c8d',
    fontSize: 12,
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  resultContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 60,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 20,
  },
  exitText: {
    fontSize: 20,
    color: 'white',
  },
  healthTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthBarContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  timeContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  barLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  barBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  healthBar: {
    height: '100%',
    borderRadius: 3,
  },
  timeBar: {
    height: '100%',
    backgroundColor: '#f39c12',
    borderRadius: 3,
  },
  barValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreValue: {
    color: '#f1c40f',
    fontSize: 16,
    fontWeight: '800',
  },
  situationCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  situationTitle: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  situationText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  objectivesCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionsContainer: {
    marginBottom: 12,
  },
  actionsTitle: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexBasis: '48%',
    minHeight: 60,
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  noActions: {
    color: '#7f8c8d',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 12,
  },
  logTitle: {
    color: '#95a5a6',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  logScroll: {
    flex: 1,
  },
  logEntry: {
    color: '#bdc3c7',
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 14,
  },
  logAction: {
    color: '#3498db',
    fontWeight: '600',
  },
  logConsequence: {
    color: '#f39c12',
  },
  logObjective: {
    color: '#27ae60',
    fontWeight: '700',
  },
  logFinal: {
    color: '#e74c3c',
    fontWeight: '800',
    fontSize: 12,
  },
});
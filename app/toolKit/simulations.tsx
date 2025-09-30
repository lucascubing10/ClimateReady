// app/(tabs)/toolkit/simulations.tsx
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { simulations, Simulation, getSimulationProgress } from '@/utils/simulationsData';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function SimulationsScreen() {
  const [selectedType, setSelectedType] = useState('all');
  const [completedSimulations, setCompletedSimulations] = useState<string[]>(['sim-1']);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const types = [
    { id: 'all', name: 'All', icon: '🎮' },
    { id: 'earthquake', name: 'Earthquake', icon: '⚡' },
    { id: 'flood', name: 'Flood', icon: '🌊' },
    { id: 'fire', name: 'Fire', icon: '🔥' },
    { id: 'hurricane', name: 'Hurricane', icon: '🌀' },
    { id: 'first-aid', name: 'First Aid', icon: '🏥' }
  ];

  const progress = getSimulationProgress(completedSimulations);

  const filteredSimulations = selectedType === 'all' 
    ? simulations 
    : simulations.filter(sim => sim.type === selectedType);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const startSimulation = (simulation: Simulation) => {
    setSelectedSimulation(simulation);
    setCurrentStep(0);
    setIsPlaying(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const nextStep = () => {
    if (selectedSimulation && currentStep < selectedSimulation.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeSimulation();
    }
  };

  const completeSimulation = () => {
    if (selectedSimulation) {
      setCompletedSimulations(prev => {
        if (!prev.includes(selectedSimulation.id)) {
          return [...prev, selectedSimulation.id];
        }
        return prev;
      });
    }
    endSimulation();
  };

  const endSimulation = () => {
    setIsPlaying(false);
    setSelectedSimulation(null);
    setCurrentStep(0);
    fadeAnim.setValue(0);
  };

  const renderSimulationCard = (simulation: Simulation) => (
    <TouchableOpacity
      key={simulation.id}
      style={[
        styles.simulationCard,
        simulation.completed && styles.simulationCardCompleted
      ]}
      onPress={() => startSimulation(simulation)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeIcon}>
          <Text style={styles.typeIconText}>
            {simulation.type === 'earthquake' ? '⚡' :
             simulation.type === 'flood' ? '🌊' :
             simulation.type === 'fire' ? '🔥' :
             simulation.type === 'hurricane' ? '🌀' : '🏥'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{simulation.title}</Text>
          <Text style={styles.cardDescription}>{simulation.description}</Text>
        </View>
        {simulation.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaInfo}>
          <View style={[styles.difficulty, { backgroundColor: getDifficultyColor(simulation.difficulty) }]}>
            <Text style={styles.difficultyText}>{simulation.difficulty}</Text>
          </View>
          <Text style={styles.metaText}>⏱️ {simulation.duration}m</Text>
          <Text style={styles.metaText}>⭐ {simulation.points}pts</Text>
        </View>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>
            {simulation.completed ? 'Play Again' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isPlaying && selectedSimulation) {
    return (
      <View style={styles.simulationContainer}>
        <Animated.View style={[styles.simulationContent, { opacity: fadeAnim }]}> 
          {/* Simulation Header */}
          <View style={styles.simulationHeader}>
            <TouchableOpacity onPress={() => router.replace('/toolKit')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.simulationTitle}>{selectedSimulation.title}</Text>
            <View style={styles.progress}>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {selectedSimulation.steps.length}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / selectedSimulation.steps.length) * 100}%` }
              ]} 
            />
          </View>

          {/* Scenario */}
          <View style={styles.scenarioSection}>
            <Text style={styles.scenarioTitle}>Scenario</Text>
            <Text style={styles.scenarioText}>{selectedSimulation.scenario}</Text>
          </View>

          {/* Current Step */}
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Current Step</Text>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
              <Text style={styles.stepInstruction}>
                {selectedSimulation.steps[currentStep]}
              </Text>
            </View>
          </View>

          {/* AR/VR Simulation Area - Mock */}
          <View style={styles.arContainer}>
            <Text style={styles.arPlaceholder}>🎮 AR/VR Simulation Active</Text>
            <Text style={styles.arDescription}>
              {selectedSimulation.steps[currentStep]}
            </Text>
            <View style={styles.arVisual}>
              <Text style={styles.arVisualText}>3D Environment</Text>
              <Text style={styles.arVisualSubtext}>Interactive simulation running...</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>
              {currentStep < selectedSimulation.steps.length - 1 ? 'Next Step' : 'Complete Simulation'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Disaster Simulations</Text>
        <Text style={styles.subtitle}>
          Practice emergency procedures through interactive scenarios
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {progress.completed}/{progress.total}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{progress.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{Math.round(progress.percentage)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>
      {/* Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.typeContainer}
      >
        {types.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              selectedType === type.id && styles.typeButtonSelected
            ]}
            onPress={() => setSelectedType(type.id)}
          >
            <Text style={styles.typeIconTextStyle}>{type.icon}</Text>
            <Text style={[styles.typeText, selectedType === type.id && styles.typeTextSelected]}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Simulations List */}
      <ScrollView style={styles.simulationsList}>
        {filteredSimulations.map(renderSimulationCard)}
        {/* Coming Soon */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
            <Text style={styles.comingSoonText}>
              More simulations including tsunami, tornado, and pandemic scenarios are in development
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    minHeight: '100%',
  },
  backButtonNav: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e8f5e8',
  },
  backButtonTextNav: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typeContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  typeButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2e7d32',
    borderWidth: 1,
  },
  typeIconTextStyle: {
    fontSize: 16,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  simulationsList: {
    flex: 1,
    padding: 16,
  },
  simulationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simulationCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  startButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoonSection: {
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 8,
  },
  comingSoonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  comingSoonText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Simulation Play Styles
  simulationContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  simulationContent: {
    flex: 1,
    padding: 16,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  simulationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  progress: {
    width: 80,
    alignItems: 'flex-end',
  },
  progressText: {
    color: 'white',
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  scenarioSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  scenarioText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  stepSection: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  stepCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  stepInstruction: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
  },
  arContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 20,
  },
  arPlaceholder: {
    fontSize: 24,
    color: 'white',
    marginBottom: 8,
  },
  arDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  arVisual: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  arVisualText: {
    fontSize: 18,
    color: 'white',
    marginBottom: 4,
  },
  arVisualSubtext: {
    fontSize: 12,
    color: '#888',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
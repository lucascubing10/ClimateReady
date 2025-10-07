// app/(tabs)/toolkit/education.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { educationalContent, EducationalContent, getEducationalProgress } from '@/utils/educationalData';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function EducationScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedContent, setCompletedContent] = useState<string[]>(['edu-2']);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: '📚' },
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'food', name: 'Food', icon: '🍎' },
    { id: 'safety', name: 'Safety', icon: '🛡️' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'shelter', name: 'Shelter', icon: '🏠' },
    { id: 'general', name: 'General', icon: '📋' }
  ];

  const progress = getEducationalProgress(completedContent);

  const filteredContent = selectedCategory === 'all' 
    ? educationalContent 
    : educationalContent.filter(item => item.category === selectedCategory);

  const getTypeIcon = (type: string) => {
    const icons = {
      infographic: '📊',
      video: '🎬',
      guide: '📖',
      simulation: '🎮'
    };
    return icons[type as keyof typeof icons] || '📁';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const toggleContentCompletion = (contentId: string) => {
    setCompletedContent(prev => {
      if (prev.includes(contentId)) {
        return prev.filter(id => id !== contentId);
      } else {
        return [...prev, contentId];
      }
    });
  };

  if (selectedContent) {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedContent(null)}>
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.title}>Educational Resources</Text>
        </View>
        <ScrollView style={styles.detailContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedContent(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>{selectedContent.title}</Text>
          <Text style={styles.detailDescription}>{selectedContent.description}</Text>

          <View style={styles.detailMeta}>
            <View style={[styles.difficulty, { backgroundColor: getDifficultyColor(selectedContent.difficulty) }]}>
              <Text style={styles.difficultyText}>{selectedContent.difficulty}</Text>
            </View>
            <Text style={styles.metaText}>⏱️ {selectedContent.duration}m</Text>
            <Text style={styles.metaText}>⭐ {selectedContent.points}pts</Text>
            <Text style={styles.metaText}>{getTypeIcon(selectedContent.type)} {selectedContent.type}</Text>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Content</Text>
            <Text style={styles.contentText}>{selectedContent.content}</Text>
          </View>

          {selectedContent.resources.length > 0 && (
            <View style={styles.resourcesSection}>
              <Text style={styles.sectionTitle}>Additional Resources</Text>
              {selectedContent.resources.map((resource, index) => (
                <TouchableOpacity key={index} style={styles.resourceLink}>
                  <Text style={styles.resourceText}>🔗 {resource}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {selectedContent.tags.map(tag => (
                <Text key={tag} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.completeButton,
              completedContent.includes(selectedContent.id) && styles.completedButton
            ]}
            onPress={() => toggleContentCompletion(selectedContent.id)}
          >
            <Text style={styles.completeButtonText}>
              {completedContent.includes(selectedContent.id) ? '✓ Completed' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.title}>Educational Resources</Text>
      </View>
      <Text style={styles.subtitle}>Learn essential preparedness skills</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{progress.completed}/{progress.total}</Text>
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
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress.percentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonSelected
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextSelected
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content List */}
      <ScrollView style={styles.contentContainer}>
        {filteredContent.map(content => (
          <TouchableOpacity 
            key={content.id}
            style={[
              styles.contentCard,
              completedContent.includes(content.id) && styles.contentCardCompleted
            ]}
            onPress={() => setSelectedContent(content)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.contentIcon}>
                <Text style={styles.iconText}>{getTypeIcon(content.type)}</Text>
              </View>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{content.title}</Text>
                <Text style={styles.contentDescription}>{content.description}</Text>
              </View>
              {completedContent.includes(content.id) && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.metaInfo}>
                <View style={[styles.difficulty, { backgroundColor: getDifficultyColor(content.difficulty) }]}>
                  <Text style={styles.difficultyText}>{content.difficulty}</Text>
                </View>
                <Text style={styles.metaText}>⏱️ {content.duration}m</Text>
                <Text style={styles.metaText}>⭐ {content.points}pts</Text>
              </View>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => setSelectedContent(content)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2e7d32',
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  contentCard: {
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
  contentCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contentDescription: {
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
  viewButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailBackButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  contentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  resourcesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resourceLink: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resourceText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  tagsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
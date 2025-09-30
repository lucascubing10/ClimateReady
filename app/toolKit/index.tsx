// app/(tabs)/toolkit/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { checklistItems } from '@/utils/checklistData';
import { getEarnedBadges } from '@/utils/badges';

export default function ToolkitScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  const categories = [
    { id: 'all', name: 'All Items', icon: '📊' },
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'food', name: 'Food', icon: '🍎' },
    { id: 'safety', name: 'Safety', icon: '🛡️' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'special_needs', name: 'Special Needs', icon: '👨‍👩‍👧‍👦' }
  ];

  // Filter items based on selected category
  const filteredItems = selectedCategory === 'all' 
    ? checklistItems 
    : checklistItems.filter(item => item.category === selectedCategory);

  // Calculate progress
  const progress = (completedItems.length / checklistItems.length) * 100;
  const completedCount = completedItems.length;
  const totalCount = checklistItems.length;

  // Update points and badges when items are completed
  useEffect(() => {
    // Calculate total points
    const points = completedItems.reduce((sum, itemId) => {
      const item = checklistItems.find(i => i.id === itemId);
      return sum + (item?.points || 0);
    }, 0);
    setUserPoints(points);

    // Calculate earned badges
    const badges = getEarnedBadges({
      completedItems,
      totalPoints: points
    });
    setEarnedBadges(badges);
  }, [completedItems]);

  const toggleItemCompletion = (itemId: string) => {
    setCompletedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffbb33';
      case 'low': return '#33cc33';
      default: return '#cccccc';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preparedness Toolkit</Text>
        <Text style={styles.subtitle}>Get your household climate-ready</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{completedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{Math.round(progress)}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{earnedBadges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/toolKit/household-setup')}
          >
            <Text style={styles.quickActionIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.quickActionText}>Household</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/toolKit/education')}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionText}>Learn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/toolKit/achievements')}
          >
            <Text style={styles.quickActionIcon}>🏆</Text>
            <Text style={styles.quickActionText}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/toolKit/simulations')}
          >
            <Text style={styles.quickActionIcon}>🎮</Text>
            <Text style={styles.quickActionText}>Simulate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} items completed
        </Text>
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

      {/* Checklist Items */}
      <ScrollView style={styles.checklistContainer}>
        {filteredItems.map(item => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.itemCard,
              completedItems.includes(item.id) && styles.itemCardCompleted
            ]}
            onPress={() => toggleItemCompletion(item.id)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <View style={[
                styles.checkbox,
                completedItems.includes(item.id) && styles.checkboxCompleted
              ]}>
                {completedItems.includes(item.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </View>

            <View style={styles.itemFooter}>
              <View style={styles.itemMeta}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
                <Text style={styles.metaText}>⏱️ {item.estimatedTime}m</Text>
                <Text style={styles.metaText}>⭐ {item.points}pts</Text>
              </View>

              {/* Special Needs Indicators */}
              <View style={styles.specialNeeds}>
                {item.customFields?.forElderly && <Text style={styles.specialNeedTag}>👵</Text>}
                {item.customFields?.forChildren && <Text style={styles.specialNeedTag}>👶</Text>}
                {item.customFields?.forPets && <Text style={styles.specialNeedTag}>🐾</Text>}
              </View>
            </View>

            {completedItems.includes(item.id) && (
              <View style={styles.completedOverlay}>
                <Text style={styles.completedText}>Completed! +{item.points}pts</Text>
              </View>
            )}
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
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  quickAction: {
    alignItems: 'center',
    padding: 8,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  checklistContainer: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
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
  itemCardCompleted: {
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  specialNeeds: {
    flexDirection: 'row',
    gap: 4,
  },
  specialNeedTag: {
    fontSize: 16,
  },
  completedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { checklistData } from '../../utils/checklistData';
import AnimatedCard from './AnimatedCard';

const ChecklistSection = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <View style={styles.container}>
      {checklistData.map((category, index) => (
        <AnimatedCard key={category.id} index={index}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={() => toggleCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryIcon}>
              {expandedCategory === category.id ? '−' : '+'}
            </Text>
          </TouchableOpacity>
          
          {expandedCategory === category.id && (
            <View style={styles.itemsContainer}>
              {category.items.map((item) => (
                <ChecklistItemRow 
                  key={item.id}
                  item={item}
                  completed={!!completedItems[item.id]}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </View>
          )}
        </AnimatedCard>
      ))}
    </View>
  );
};

const ChecklistItemRow = ({ item, completed, onToggle }: { 
  item: any; 
  completed: boolean; 
  onToggle: () => void; 
}) => {
  const progress = useSharedValue(completed ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(progress.value ? 0.95 : 1) }],
      opacity: interpolate(progress.value, [0, 1], [1, 0.7])
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(progress.value ? 1 : 0.8) }],
      opacity: withTiming(progress.value ? 1 : 0.5)
    };
  });

  const handlePress = () => {
    progress.value = completed ? 0 : 1;
    onToggle();
  };

  return (
    <Animated.View style={[styles.itemRow, animatedStyle]}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.checkbox, checkmarkStyle, completed && styles.checkboxCompleted]}>
          {completed && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>
        <Text style={[styles.itemText, completed && styles.itemTextCompleted]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  categoryIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemText: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
});

export default ChecklistSection;
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import ChecklistItem from './ChecklistItem';
import { ProgressBar } from './ProgressBar';

interface ChecklistCategoryProps {
  category: any;
  progress: any;
  onToggleItem: (categoryId: string, itemId: string, completed: boolean) => void;
  index: number;
}

const ChecklistCategory = ({ category, progress, onToggleItem, index }: ChecklistCategoryProps) => {
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const animationProgress = useSharedValue(0);

  React.useEffect(() => {
    animationProgress.value = withSpring(expanded ? 1 : 0);
  }, [expanded]);

  const arrowStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animationProgress.value, [0, 1], [0, 90]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  // Calculate progress for this category
  const categoryProgress = progress.checklists[category.id] || {};
  const completedItems = Object.values(categoryProgress).filter(Boolean).length;
  const totalItems = category.items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <View style={[styles.categoryContainer, isLargeScreen && styles.categoryContainerLarge]}>
      <TouchableOpacity 
        style={styles.categoryHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.categoryProgress}>
            {completedItems}/{totalItems} completed
          </Text>
        </View>
        
        <Animated.Text style={[styles.arrow, arrowStyle]}>
          ▶
        </Animated.Text>
      </TouchableOpacity>

      <ProgressBar progress={progressPercentage} />

      {expanded && (
        <View style={styles.itemsContainer}>
          {category.items.map((item: any) => (
            <ChecklistItem
              key={item.id}
              item={item}
              completed={!!progress.checklists[category.id]?.[item.id]}
              onToggle={(completed) => onToggleItem(category.id, item.id, completed)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContainerLarge: {
    width: '48%',
    minWidth: 300,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  categoryProgress: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginTop: 4,
  },
  itemsContainer: {
    marginTop: 12,
  },
});

export default ChecklistCategory;
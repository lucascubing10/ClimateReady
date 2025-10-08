import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import checklistData from '../../utils/checklistData';
import ChecklistCategory from './ChecklistCategory';
import type { ChecklistCategoryType } from '../../utils/checklistData';

interface ChecklistSectionProps {
  progress: any;
  onToggleItem: (categoryId: string, itemId: string, completed: boolean) => void;
}

const ChecklistSection = ({ progress, onToggleItem }: ChecklistSectionProps) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768; // Tablet size

  if (!progress) {
    return (
      <View style={styles.container}>
        <Text>Loading checklists...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isLargeScreen && styles.containerLarge]}>
      {checklistData.map((category: ChecklistCategoryType, index: number) => (
      <ChecklistCategory
        key={category.id}
        category={category}
        progress={progress}
        onToggleItem={onToggleItem}
        index={index}
      />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  containerLarge: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default ChecklistSection;
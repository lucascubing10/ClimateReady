import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { checklistData } from '../../utils/checklistData';
import ChecklistCategory from '@/components/Toolkit/ChecklistCategory';

interface ChecklistSectionProps {
  progress: any;
  onToggleItem: (categoryId: string, itemId: string, completed: boolean) => void;
}

const ChecklistSection = ({ progress, onToggleItem }: ChecklistSectionProps) => {
  if (!progress) {
    return (
      <View style={styles.container}>
        <Text>Loading checklists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {checklistData.map((category, index) => (
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
    padding: 16,
  },
});

export default ChecklistSection;
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';

interface ChecklistItemProps {
  item: any;
  completed: boolean;
  onToggle: (completed: boolean) => void;
}

const ChecklistItem = ({ item, completed, onToggle }: ChecklistItemProps) => {
  const progress = useSharedValue(completed ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(completed ? 1 : 0, { duration: 300 });
  }, [completed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(progress.value ? 0.98 : 1) }],
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
    onToggle(!completed);
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
        {completed && (
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{item.points}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemRow: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    lineHeight: 20,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  pointsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  pointsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChecklistItem;
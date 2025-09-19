import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withDelay
} from 'react-native-reanimated';
import { educationalContent } from '../../utils/educationalData';
import AnimatedCard from '@/components/Toolkit/AnimatedCard';

const EducationalContent = () => {
  return (
    <View style={styles.container}>
      {educationalContent.map((item, index) => (
        <EducationalCard key={item.id} item={item} index={index} />
      ))}
    </View>
  );
};

const EducationalCard = ({ item, index }: { item: any; index: number }) => {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(index * 150, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [50, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { width: width - 32, marginHorizontal: 16 }]}>
      <AnimatedCard index={index}>
        <View style={styles.card}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Image</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
            
            <TouchableOpacity style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 16,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  readMoreText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EducationalContent;
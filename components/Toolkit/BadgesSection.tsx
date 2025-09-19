import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  interpolate
} from 'react-native-reanimated';
// If badgesData is a default export:
import badgesData from '@/components/Toolkit/badgesData';

interface BadgesSectionProps {
  badges?: typeof badgesData;
}

import AnimatedCard from '@/components/Toolkit/AnimatedCard';

const BadgesSection = ({ badges }: BadgesSectionProps) => {
  const displayBadges = badges || badgesData;
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Achievements</Text>
      <Text style={styles.sectionSubtitle}>Earn badges by completing preparedness tasks</Text>
      <View style={styles.badgesGrid}>
        {displayBadges.map((badge: any, index: number) => (
          <BadgeCard key={badge.id} badge={badge} index={index} />
        ))}
      </View>
    </View>
  );
};

const BadgeCard = ({ badge, index }: { badge: any; index: number }) => {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(index * 200, withSpring(1));
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
    <Animated.View style={[animatedStyle, { width: (width - 48) / 2 }]}>
      <AnimatedCard index={index}>
        <View style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
          <View style={styles.badgeIconContainer}>
            <Text style={styles.badgeIcon}>
              {badge.earned ? badge.icon : '🔒'}
            </Text>
          </View>
          
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDescription} numberOfLines={2}>
            {badge.description}
          </Text>
          
          {badge.earned && (
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedText}>Earned</Text>
            </View>
          )}
        </View>
      </AnimatedCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  badgeCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.7,
    backgroundColor: '#f8fafc',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    fontSize: 30,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  earnedBadge: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10b981',
    borderRadius: 12,
  },
  earnedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default BadgesSection;
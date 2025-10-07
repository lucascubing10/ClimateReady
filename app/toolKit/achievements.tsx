// app/(tabs)/toolkit/achievements.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { badges, Badge, getEarnedBadges } from '@/utils/badges';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserProgress } from '@/utils/storage';

export default function AchievementsScreen() {
  const [activeTab, setActiveTab] = useState<'earned' | 'all'>('earned');
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<{
    completedItems: string[];
    totalPoints: number;
  }>({
    completedItems: [],
    totalPoints: 0
  });

  // Mock animation values
  const scaleAnims = badges.reduce((acc, badge) => {
    acc[badge.id] = new Animated.Value(1);
    
    return acc;
  }, {} as Record<string, Animated.Value>);

  useEffect(() => {
    // Load user progress from persistent storage
    const loadProgress = async () => {
      const progress = await getUserProgress();
      setUserProgress({
        completedItems: progress.completedItems,
        totalPoints: progress.points
      });
      const badges = getEarnedBadges({
        completedItems: progress.completedItems,
        totalPoints: progress.points
      });
      setEarnedBadges(badges);
    };
    loadProgress();
  }, []);

  const animateBadge = (badgeId: string) => {
    Animated.sequence([
      Animated.timing(scaleAnims[badgeId], {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[badgeId], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getProgressForBadge = (badge: Badge): number => {
    switch (badge.id) {
      case 'badge-1': // 5 items
        return Math.min(userProgress.completedItems.length / 5, 1);
      case 'badge-2': // Water items
        const waterItems = ['water-1', 'water-2'];
        const completedWater = waterItems.filter(item => userProgress.completedItems.includes(item)).length;
        return completedWater / waterItems.length;
      case 'badge-3': // Safety items
        const safetyItems = ['safety-1', 'safety-2'];
        const completedSafety = safetyItems.filter(item => userProgress.completedItems.includes(item)).length;
        return completedSafety / safetyItems.length;
      case 'badge-4': // Special needs items
        const specialItems = ['special-1', 'special-2', 'special-3'];
        const completedSpecial = specialItems.filter(item => userProgress.completedItems.includes(item)).length;
        return completedSpecial / specialItems.length;
      default:
        return 0;
    }
  };

  const earnedBadgesList = badges.filter(badge => earnedBadges.includes(badge.id));
  const lockedBadges = badges.filter(badge => !earnedBadges.includes(badge.id));

  const renderBadgeCard = (badge: Badge, isEarned: boolean) => (
    <Animated.View 
      key={badge.id}
      style={[
        styles.badgeCard,
        isEarned ? styles.badgeCardEarned : styles.badgeCardLocked,
        { transform: [{ scale: isEarned ? scaleAnims[badge.id] : 1 }] }
      ]}
    >
      <View style={styles.badgeHeader}>
        <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeIconText}>{badge.icon}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
        </View>
        {isEarned && (
          <View style={styles.earnedIndicator}>
            <Text style={styles.earnedText}>🎉 Earned!</Text>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        {!isEarned && (
          <>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${getProgressForBadge(badge) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(getProgressForBadge(badge) * 100)}% complete
            </Text>
          </>
        )}
        
        {isEarned && (
          <View style={styles.achievementDate}>
            <Text style={styles.dateText}>Earned today!</Text>
          </View>
        )}
      </View>

      <View style={styles.requirements}>
        <Text style={styles.requirementsTitle}>Requirements:</Text>
        <Text style={styles.requirementsText}>
          {badge.requirements.type === 'checklist_completion' && `Complete ${badge.requirements.target} checklist items`}
          {badge.requirements.type === 'category_mastery' && `Complete ${badge.requirements.target} ${badge.requirements.category} items`}
          {badge.requirements.type === 'content_completion' && `Complete ${badge.requirements.target} educational modules`}
          {badge.requirements.type === 'points' && `Earn ${badge.requirements.target} total points`}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
      </View>
      <Text style={styles.subtitle}>Track your preparedness progress</Text>
      
      <View style={styles.statsOverview}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{earnedBadges.length}</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{userProgress.totalPoints}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{Math.round((earnedBadges.length / badges.length) * 100)}%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'earned' && styles.tabActive]}
          onPress={() => setActiveTab('earned')}
        >
          <Text style={[styles.tabText, activeTab === 'earned' && styles.tabTextActive]}>
            Earned ({earnedBadges.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Badges ({badges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Badges List */}
      <ScrollView style={styles.badgesContainer}>
        {activeTab === 'earned' ? (
          earnedBadgesList.length > 0 ? (
            earnedBadgesList.map(badge => renderBadgeCard(badge, true))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateTitle}>No Badges Yet</Text>
              <Text style={styles.emptyStateText}>
                Complete checklist items to earn your first badge!
              </Text>
            </View>
          )
        ) : (
          <>
            {/* Earned Badges */}
            {earnedBadgesList.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Earned Badges</Text>
                {earnedBadgesList.map(badge => renderBadgeCard(badge, true))}
              </View>
            )}
            
            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Badges</Text>
                {lockedBadges.map(badge => renderBadgeCard(badge, false))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 0,
    backgroundColor: "white",
  },
  backButton: {
    marginRight: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6366f1",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "left",
  },
  statsOverview: {
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
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  badgesContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 8,
  },
  badgeCard: {
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
  badgeCardEarned: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeIconText: {
    fontSize: 20,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
  },
  earnedIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earnedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  achievementDate: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  requirements: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
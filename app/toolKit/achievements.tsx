// app/(tabs)/toolkit/achievements.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions 
} from 'react-native';
import { badges, Badge, getEarnedBadges } from '@/utils/badges';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserProgress } from '@/utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Color palette matching your app
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

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

  // Animation values
  const scaleAnims = badges.reduce((acc, badge) => {
    acc[badge.id] = new Animated.Value(1);
    return acc;
  }, {} as Record<string, Animated.Value>);

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

  useEffect(() => {
    loadProgress();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, [])
  );

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
        { transform: [{ scale: isEarned ? scaleAnims[badge.id] : 1 }] }
      ]}
    >
      <LinearGradient
        colors={isEarned ? ["#f0fdf4", "#dcfce7"] : ["#fff", "#f8fafc"]}
        style={styles.badgeGradient}
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
              <Ionicons name="trophy" size={16} color="#fff" />
              <Text style={styles.earnedText}>Earned!</Text>
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
              <Ionicons name="checkmark-circle" size={16} color={PRIMARY} />
              <Text style={styles.dateText}>Completed!</Text>
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
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/tabs/toolKit')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>Track your preparedness progress</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <LinearGradient
            colors={["#fff", "#f8fafc"]}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="trophy" size={20} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{earnedBadges.length}</Text>
                <Text style={styles.statLabel}>Badges Earned</Text>
              </View>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="star" size={20} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{userProgress.totalPoints}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="checkmark-done" size={20} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{Math.round((earnedBadges.length / badges.length) * 100)}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
            </View>
          </LinearGradient>
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
        <ScrollView style={styles.badgesContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'earned' ? (
            earnedBadgesList.length > 0 ? (
              earnedBadgesList.map(badge => renderBadgeCard(badge, true))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="trophy-outline" size={48} color={PRIMARY} />
                </View>
                <Text style={styles.emptyStateTitle}>No Badges Yet</Text>
                <Text style={styles.emptyStateText}>
                  Complete checklist items to earn your first badge!
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/tabs/toolKit')}
                >
                  <LinearGradient
                    colors={PRIMARY_GRADIENT as unknown as readonly [import('react-native').ColorValue, import('react-native').ColorValue, ...import('react-native').ColorValue[]]}
                    style={styles.emptyStateButtonGradient}
                  >
                    <Text style={styles.emptyStateButtonText}>Start Checklist</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: PRIMARY,
    top: -150,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: YELLOW,
    bottom: -50,
    left: -50,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: ORANGE,
    top: '30%',
    right: '20%',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  statsOverview: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statsGradient: {
    borderRadius: 24,
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#e8f5e8',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
  badgesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    marginLeft: 8,
  },
  badgeCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeGradient: {
    padding: 16,
    borderRadius: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#1f2937',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  earnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
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
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  achievementDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
  },
  requirements: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
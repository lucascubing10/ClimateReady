// app/(tabs)/toolkit/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { checklistItems } from '@/utils/checklistData';
import { getEarnedBadges } from '@/utils/badges';
import { getUserProgress, updateChecklistItem } from '@/utils/storage';
import { getUserProfile } from '../../utils/profile';
import { getPersonalizedToolkit } from '../../utils/gemini';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 🔹 Enhanced Expandable Card Component
type ExpandableCardProps = {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

const ExpandableCard = ({ title, icon, color, children, defaultExpanded = false }: ExpandableCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggleExpand = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <View style={styles.expandableCard}>
      <TouchableOpacity 
        style={[styles.expandableHeader, { borderLeftColor: color }]} 
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.expandableTitleContainer}>
          <Text style={styles.expandableIcon}>{icon}</Text>
          <Text style={styles.expandableTitle}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={22} color={color} />
        </Animated.View>
      </TouchableOpacity>
      
      {expanded && (
        <Animated.View 
          style={[
            styles.expandableContent,
            {
              opacity: rotateAnim,
              transform: [{
                translateY: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }]
            }
          ]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
};

// Floating Action Button Component
type FloatingActionButtonProps = {
  onPress: () => void;
  icon: string;
  color?: string;
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress, icon, color = '#6366f1' }) => {
  const scaleAnim = useState(new Animated.Value(1))[0];
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={[styles.fab, { backgroundColor: color }]} onPress={handlePress}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ToolkitScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [personalizedToolkit, setPersonalizedToolkit] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDisaster, setActiveDisaster] = useState<string | null>('hurricane');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const headerScale = useState(new Animated.Value(0.8))[0];

  const categories = [
    { id: 'all', name: 'All', icon: '📊', color: '#6366f1', gradient: ['#6366f1', '#8b5cf6'] },
    { id: 'water', name: 'Water', icon: '💧', color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
    { id: 'food', name: 'Food', icon: '🍎', color: '#ef4444', gradient: ['#ef4444', '#f87171'] },
    { id: 'safety', name: 'Safety', icon: '🛡️', color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] },
    { id: 'health', name: 'Health', icon: '🏥', color: '#10b981', gradient: ['#10b981', '#34d399'] },
    { id: 'special_needs', name: 'Special', icon: '👨‍👩‍👧‍👦', color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] }
  ];

  // Filter items
  const filteredItems = selectedCategory === 'all' 
    ? checklistItems 
    : checklistItems.filter(item => item.category === selectedCategory);

  // Progress
  const progress = (completedItems.length / checklistItems.length) * 100;
  const completedCount = completedItems.length;
  const totalCount = checklistItems.length;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [progress]);

  // Load progress
  const loadProgress = useCallback(async () => {
    setLoading(true);
    const userProgress = await getUserProgress();
    const completed: string[] = [];
    Object.entries(userProgress.checklists).forEach(([cat, items]) => {
      Object.entries(items).forEach(([id, done]) => {
        if (done) completed.push(id);
      });
    });
    setCompletedItems(completed);

    const points = completed.reduce((sum, itemId) => {
      const item = checklistItems.find(i => i.id === itemId);
      return sum + (item?.points || 0);
    }, 0);
    setUserPoints(points);

    const badges = getEarnedBadges({ completedItems: completed, totalPoints: points });
    setEarnedBadges(badges);
    setLoading(false);
  }, []);

  // Load AI toolkit
  useEffect(() => {
    loadProgress();
    (async () => {
      setAiLoading(true);
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      // Simulate AI loading
      setTimeout(() => {
        setPersonalizedToolkit([
          "Portable water filter",
          "Emergency radio with charging",
          "7-day medication supply",
          "Important documents waterproof case",
          "Family contact cards"
        ]);
        setAiLoading(false);
      }, 2000);
    })();
  }, [loadProgress, activeDisaster]);

  // Animate mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, []);

  const toggleItemCompletion = async (itemId: string) => {
    const isCompleted = completedItems.includes(itemId);
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;
    
    await updateChecklistItem(item.category, item.id, !isCompleted);
    await loadProgress();

    if (!isCompleted) {
      Alert.alert(
        'Great Job! 🎉',
        `You completed "${item.title}" and earned ${item.points} points!`,
        [{ text: 'Awesome!' }]
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '⚡';
      case 'high': return '🔥';
      case 'medium': return '⚠️';
      case 'low': return '💚';
      default: return '📌';
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
          <View>
            <Text style={styles.greeting}>Emergency Preparedness</Text>
            <Text style={styles.subtitle}>Stay ready, stay safe</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.profileGradient}>
              <Ionicons name="person" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Emergency Alert */}
        {activeDisaster && (
          <Animated.View style={styles.emergencyBanner}>
            <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.emergencyGradient}>
              <View style={styles.emergencyContent}>
                <View style={styles.emergencyIconContainer}>
                  <Ionicons name="warning" size={24} color="#fff" />
                </View>
                <View style={styles.emergencyTextContainer}>
                  <Text style={styles.emergencyTitle}>ACTIVE DISASTER ALERT</Text>
                  <Text style={styles.emergencyText}>
                    {activeDisaster.charAt(0).toUpperCase() + activeDisaster.slice(1)} detected in your area
                  </Text>
                </View>
                <TouchableOpacity style={styles.emergencyAction}>
                  <Text style={styles.emergencyActionText}>VIEW</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Progress Overview */}
          <View style={styles.progressOverview}>
            <LinearGradient colors={['#fff', '#f8fafc']} style={styles.progressGradient}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Your Preparedness</Text>
                  <Text style={styles.progressSubtitle}>{completedCount} of {totalCount} items complete</Text>
                </View>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View 
                    style={[styles.progressBarFill, { 
                      width: progressAnim.interpolate({ 
                        inputRange: [0, 100], 
                        outputRange: ['0%', '100%'] 
                      }),
                      backgroundColor: selectedCategoryData?.color || '#6366f1'
                    }]} 
                  />
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-done" size={20} color="#10b981" />
                  <Text style={styles.statNumber}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={20} color="#f59e0b" />
                  <Text style={styles.statNumber}>{userPoints}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="trophy" size={20} color="#8b5cf6" />
                  <Text style={styles.statNumber}>{earnedBadges.length}</Text>
                  <Text style={styles.statLabel}>Badges</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {[
              { icon: 'people', label: 'Household', route: '/toolKit/household-setup', color: '#3b82f6' },
              { icon: 'book', label: 'Learn', route: '/toolKit/education', color: '#10b981' },
              { icon: 'trophy', label: 'Badges', route: '/toolKit/achievements', color: '#f59e0b' },
              { icon: 'game-controller', label: 'Simulate', route: '/toolKit/simulations', color: '#8b5cf6' }
            ].map((action, index) => (
              <Animated.View 
                key={action.label} 
                style={{ 
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (index + 1), 0]
                    })
                  }]
                }}
              >
                <TouchableOpacity 
                  style={styles.quickAction} 
                  onPress={() => router.push(action.route as any)}
                >
                  <LinearGradient colors={[action.color, `${action.color}dd`]} style={styles.quickActionGradient}>
                    <Ionicons name={action.icon as any} size={24} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* AI Recommended Section */}
          <ExpandableCard title="AI Recommended Toolkit" icon="✨" color="#7c3aed" defaultExpanded>
            <Text style={styles.aiSubtitle}>Personalized for your household and location</Text>
            
            {aiLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#7c3aed" />
                <Text style={styles.loadingText}>Analyzing your profile for recommendations...</Text>
              </View>
            ) : (
              <View style={styles.aiChecklistItems}>
                {personalizedToolkit?.map((item, idx) => {
                  const found = checklistItems.find(i => i.title === item);
                  const isCompleted = found ? completedItems.includes(found.id) : false;
                  
                  return (
                    <TouchableOpacity
                      key={item+idx}
                      style={[styles.aiChecklistItem, isCompleted && styles.aiChecklistItemCompleted]}
                      onPress={() => {
                        if (found) toggleItemCompletion(found.id);
                        else Alert.alert('Not in main checklist', 'This item is not part of your main checklist.');
                      }}
                    >
                      <LinearGradient 
                        colors={isCompleted ? ['#7c3aed', '#6d28d9'] : ['#f8fafc', '#f1f5f9']} 
                        style={styles.aiChecklistGradient}
                      >
                        <Ionicons 
                          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                          size={20} 
                          color={isCompleted ? "#fff" : "#9ca3af"} 
                        />
                        <Text style={[styles.aiChecklistText, isCompleted && styles.aiChecklistTextCompleted]}>
                          {item}
                        </Text>
                        {!found && <Ionicons name="sparkles" size={16} color="#7c3aed" />}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ExpandableCard>

          {/* Preparedness Checklist */}
          <ExpandableCard title="Complete Preparedness Checklist" icon="📋" color="#6366f1" defaultExpanded>
            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryContainer}
              contentContainerStyle={styles.categoryContent}
            >
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <LinearGradient
                    colors={
                      selectedCategory === category.id
                        ? category.gradient as [string, string]
                        : ['#f8fafc', '#f1f5f9'] as [string, string]
                    }
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.categoryButtonSelected
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Checklist Items */}
            <View style={styles.checklistItems}>
              {filteredItems.map((item, index) => {
                const isCompleted = completedItems.includes(item.id);
                
                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      isCompleted && styles.itemCardCompleted,
                      {
                        opacity: fadeAnim,
                        transform: [{
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20 * (index + 1), 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      onPress={() => toggleItemCompletion(item.id)} 
                      activeOpacity={0.7}
                      style={styles.itemTouchable}
                    >
                      <LinearGradient
                        colors={isCompleted ? ['#f0fdf4', '#dcfce7'] : ['#fff', '#f8fafc']}
                        style={styles.itemGradient}
                      >
                        {/* Completion Indicator */}
                        <View style={[styles.completionIndicator, isCompleted && styles.completionIndicatorCompleted]}>
                          {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>

                        <View style={styles.itemContent}>
                          <View style={styles.itemHeader}>
                            <Text style={[styles.itemTitle, isCompleted && styles.itemTitleCompleted]}>
                              {item.title}
                            </Text>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                              <Text style={styles.priorityIcon}>{getPriorityIcon(item.priority)}</Text>
                              <Text style={styles.priorityText}>{item.priority}</Text>
                            </View>
                          </View>
                          
                          <Text style={styles.itemDescription}>{item.description}</Text>
                          
                          <View style={styles.itemFooter}>
                            <View style={styles.itemMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={14} color="#6b7280" />
                                <Text style={styles.metaText}>{item.estimatedTime}m</Text>
                              </View>
                              <View style={styles.metaItem}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={styles.metaText}>{item.points}pts</Text>
                              </View>
                            </View>
                            
                            <View style={styles.specialNeeds}>
                              {item.customFields?.forElderly && (
                                <View style={styles.specialNeedTag}><Text style={styles.specialNeedText}>👵 Elderly</Text></View>
                              )}
                              {item.customFields?.forChildren && (
                                <View style={styles.specialNeedTag}><Text style={styles.specialNeedText}>👶 Children</Text></View>
                              )}
                              {item.customFields?.forPets && (
                                <View style={styles.specialNeedTag}><Text style={styles.specialNeedText}>🐾 Pets</Text></View>
                              )}
                            </View>
                          </View>
                        </View>

                        {isCompleted && (
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.completedRibbon}>
                            <Ionicons name="trophy" size={12} color="#fff" />
                            <Text style={styles.completedText}>+{item.points}pts</Text>
                          </LinearGradient>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ExpandableCard>
        </ScrollView>
      </Animated.View>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onPress={() => Alert.alert('Quick Action', 'Add custom item')}
        icon="add"
        color="#6366f1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: '#6366f1',
    top: -150,
    right: -100
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: '#10b981',
    bottom: -50,
    left: -50
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: '#f59e0b',
    top: '30%',
    right: '20%'
  },
  content: { 
    flex: 1, 
    zIndex: 1 
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4
  },
  profileButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emergencyBanner: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10
  },
  emergencyGradient: {
    borderRadius: 20,
    padding: 4
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.95)'
  },
  emergencyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  emergencyTextContainer: {
    flex: 1
  },
  emergencyTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 2
  },
  emergencyText: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9
  },
  emergencyAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  emergencyActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  progressOverview: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8
  },
  progressGradient: {
    borderRadius: 24,
    padding: 24
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6b7280'
  },
  progressBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  progressPercent: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  },
  progressBarContainer: {
    marginBottom: 20
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 8
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600'
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 20
  },
  quickAction: {
    alignItems: 'center',
    flex: 1
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center'
  },
  expandableCard: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden'
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderLeftWidth: 4
  },
  expandableTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  expandableIcon: {
    fontSize: 20,
    marginRight: 12
  },
  expandableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1
  },
  expandableContent: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#f1f5f9'
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14
  },
  aiChecklistItems: {
    gap: 8
  },
  aiChecklistItem: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  aiChecklistGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  aiChecklistItemCompleted: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  aiChecklistText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500'
  },
  aiChecklistTextCompleted: {
    color: '#fff',
    fontWeight: '600'
  },
  categoryContainer: {
    marginBottom: 16
  },
  categoryContent: {
    paddingRight: 8,
    gap: 8
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  categoryButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  categoryIcon: {
    fontSize: 16
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600'
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '700'
  },
  checklistItems: {
    gap: 12
  },
  itemCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  itemCardCompleted: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  itemTouchable: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  itemGradient: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  completionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  completionIndicatorCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  itemContent: {
    flex: 1
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
    lineHeight: 22
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af'
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  priorityIcon: {
    fontSize: 10
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  },
  specialNeeds: {
    flexDirection: 'row',
    gap: 6
  },
  specialNeedTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  specialNeedText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '600'
  },
  completedRibbon: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  completedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700'
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10
  }
});
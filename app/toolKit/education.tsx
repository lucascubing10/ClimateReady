// app/(tabs)/toolkit/education.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { fetchAllEducationalContent, EducationalContent } from "@/utils/educationalService";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Color palette matching your app
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT = ['#5ba24f', '#4a8c40'] as const;
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

// Custom Button Component
const CustomButton = ({ title, onPress, style, variant = 'primary', isLoading = false }: any) => {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity 
        style={[styles.secondaryButton, style]} 
        onPress={onPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={PRIMARY} />
        ) : (
          <Text style={styles.secondaryButtonText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.primaryButton, style]} 
      onPress={onPress}
      disabled={isLoading}
    >
      <LinearGradient
        colors={PRIMARY_GRADIENT}
        style={styles.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function EducationScreen() {
  const [educationalContent, setEducationalContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedContent, setCompletedContent] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const content = await fetchAllEducationalContent();
      setEducationalContent(content);
      
      // Load completed content from storage (you'll need to implement this)
      // const savedCompleted = await AsyncStorage.getItem('completedEducationalContent');
      // if (savedCompleted) {
      //   setCompletedContent(JSON.parse(savedCompleted));
      // }
    } catch (error) {
      console.error('Error loading educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: '📚', color: PRIMARY },
    { id: 'water', name: 'Water', icon: '💧', color: '#3b82f6' },
    { id: 'food', name: 'Food', icon: '🍎', color: ORANGE },
    { id: 'safety', name: 'Safety', icon: '🛡️', color: YELLOW },
    { id: 'health', name: 'Health', icon: '🏥', color: '#10b981' },
    { id: 'shelter', name: 'Shelter', icon: '🏠', color: '#8b5cf6' },
    { id: 'general', name: 'General', icon: '📋', color: '#6b7280' }
  ];

  const progress = {
    total: educationalContent.length,
    completed: completedContent.length,
    percentage: educationalContent.length > 0 ? (completedContent.length / educationalContent.length) * 100 : 0,
    points: completedContent.reduce((acc, id) => {
      const content = educationalContent.find(c => c.id === id);
      return acc + (content?.points || 0);
    }, 0),
  };

  const filteredContent = selectedCategory === 'all' 
    ? educationalContent 
    : educationalContent.filter(item => item.category === selectedCategory);

  const getTypeIcon = (type: string) => {
    const icons = {
      infographic: '📊',
      video: '🎬',
      guide: '📖',
      simulation: '🎮',
      article: '📝',
      tutorial: '🎯'
    };
    return icons[type as keyof typeof icons] || '📁';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const toggleContentCompletion = async (contentId: string) => {
    const newCompleted = completedContent.includes(contentId)
      ? completedContent.filter(id => id !== contentId)
      : [...completedContent, contentId];
    
    setCompletedContent(newCompleted);
    
    // Save to storage (you'll need to implement this)
    // await AsyncStorage.setItem('completedEducationalContent', JSON.stringify(newCompleted));
  };

  const handleContentSelect = async (content: EducationalContent) => {
    setContentLoading(true);
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setSelectedContent(content);
    setContentLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading educational content...</Text>
      </View>
    );
  }

  if (selectedContent) {
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
            <TouchableOpacity onPress={() => setSelectedContent(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Educational Resources</Text>
              <Text style={styles.subtitle}>Learn essential preparedness skills</Text>
            </View>
          </View>

          <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedContent.title}</Text>
              <Text style={styles.detailDescription}>{selectedContent.description}</Text>

              <View style={styles.detailMeta}>
                <View style={[styles.difficulty, { backgroundColor: getDifficultyColor(selectedContent.difficulty) }]}>
                  <Text style={styles.difficultyText}>{selectedContent.difficulty}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.metaText}>{selectedContent.duration}m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star-outline" size={16} color="#6b7280" />
                  <Text style={styles.metaText}>{selectedContent.points}pts</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>{getTypeIcon(selectedContent.type)}</Text>
                  <Text style={styles.metaText}>{selectedContent.type}</Text>
                </View>
              </View>

              <View style={styles.contentSection}>
                <Text style={styles.sectionTitle}>Content</Text>
                <Text style={styles.contentText}>
                  {selectedContent.content || 'Content loading...'}
                </Text>
              </View>

              {selectedContent.resources && selectedContent.resources.length > 0 && (
                <View style={styles.resourcesSection}>
                  <Text style={styles.sectionTitle}>Additional Resources</Text>
                  {selectedContent.resources.map((resource, index) => (
                    <TouchableOpacity key={index} style={styles.resourceLink}>
                      <Ionicons name="link-outline" size={16} color={PRIMARY} />
                      <Text style={styles.resourceText}>{resource}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <View style={styles.tagsSection}>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {selectedContent.tags.map(tag => (
                      <Text key={tag} style={styles.tag}>#{tag}</Text>
                    ))}
                  </View>
                </View>
              )}

              <CustomButton
                title={completedContent.includes(selectedContent.id) ? '✓ Completed' : 'Mark as Complete'}
                onPress={() => toggleContentCompletion(selectedContent.id)}
                variant={completedContent.includes(selectedContent.id) ? 'secondary' : 'primary'}
                style={styles.completeButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

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
            <Text style={styles.title}>Educational Resources</Text>
            <Text style={styles.subtitle}>Learn essential preparedness skills</Text>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={["#fff", "#f8fafc"]}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>Learning Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {progress.completed} of {progress.total} resources completed
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressPercent}>
                  {Math.round(progress.percentage)}%
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${progress.percentage}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressStats}>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="checkmark-done" size={16} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{progress.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="star" size={16} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{progress.points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="library" size={16} color={PRIMARY} />
                </View>
                <Text style={styles.statNumber}>{progress.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
              >
                <LinearGradient
                  colors={
                    selectedCategory === category.id
                      ? [category.color, `${category.color}dd`]
                      : ["#f8fafc", "#f1f5f9"]
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
        </View>

        {/* Content List */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {contentLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading content...</Text>
            </View>
          ) : filteredContent.length > 0 ? (
            filteredContent.map((content, index) => (
              <TouchableOpacity 
                key={content.id}
                style={styles.contentCard}
                onPress={() => handleContentSelect(content)}
              >
                <LinearGradient
                  colors={completedContent.includes(content.id) ? ["#f0fdf4", "#dcfce7"] : ["#fff", "#f8fafc"]}
                  style={styles.contentGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.contentIconContainer}>
                      <Text style={styles.contentIcon}>{getTypeIcon(content.type)}</Text>
                    </View>
                    <View style={styles.contentInfo}>
                      <Text style={styles.contentTitle}>{content.title}</Text>
                      <Text style={styles.contentDescription}>{content.description}</Text>
                    </View>
                    {completedContent.includes(content.id) && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.metaInfo}>
                      <View style={[styles.difficulty, { backgroundColor: getDifficultyColor(content.difficulty) }]}>
                        <Text style={styles.difficultyText}>{content.difficulty}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{content.duration}m</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="star-outline" size={14} color="#6b7280" />
                        <Text style={styles.metaText}>{content.points}pts</Text>
                      </View>
                    </View>
                    <CustomButton
                      title="Learn"
                      onPress={() => handleContentSelect(content)}
                      variant="secondary"
                      style={styles.viewButton}
                      isLoading={contentLoading}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={48} color={PRIMARY} />
              <Text style={styles.emptyStateTitle}>No Content Available</Text>
              <Text style={styles.emptyStateText}>
                {selectedCategory === 'all' 
                  ? 'No educational content found. Please check back later.'
                  : `No ${selectedCategory} content available. Try another category.`
                }
              </Text>
              {selectedCategory !== 'all' && (
                <CustomButton
                  title="View All Content"
                  onPress={() => setSelectedCategory('all')}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
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
  progressCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  progressGradient: {
    borderRadius: 24,
    padding: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercent: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 24,
  },
  categoryContent: {
    paddingRight: 8,
    gap: 8,
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
    elevation: 2,
  },
  categoryButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentGradient: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentIcon: {
    fontSize: 18,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  completedBadge: {
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaIcon: {
    fontSize: 12,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // Detail View Styles
  detailContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  detailCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  resourcesSection: {
    marginBottom: 24,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resourceText: {
    fontSize: 14,
    color: PRIMARY,
    flex: 1,
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeButton: {
    marginTop: 8,
  },
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY,
    textAlign: 'center',
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
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
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
    minWidth: 160,
  },
  // Button Styles
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
});
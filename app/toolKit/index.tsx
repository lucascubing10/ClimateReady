// app/(tabs)/toolkit/index.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { checklistItems } from "@/utils/checklistData";
import { getEarnedBadges } from "@/utils/badges";
import { getUserProgress, updateChecklistItem } from "@/utils/storage";
import { getUserProfile } from "../../utils/profile";
import { getPersonalizedToolkit } from "../../utils/gemini";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// 🔹 Enhanced Expandable Card Component
type ExpandableCardProps = {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

const ExpandableCard = ({
  title,
  icon,
  color,
  children,
  defaultExpanded = false,
}: ExpandableCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useState(new Animated.Value(defaultExpanded ? 1 : 0))[0];

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const toggleExpand = () => setExpanded((e) => !e);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
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
      {expanded && <View style={styles.expandableContent}>{children}</View>}
    </View>
  );
};

// Floating Action Button Component
type FloatingActionButtonProps = {
  onPress: () => void;
  icon: string;
  color?: string;
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  color = "#6366f1",
}) => {
  const scaleAnim = useState(new Animated.Value(1))[0];

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: color }]}
        onPress={handlePress}
      >
        <Ionicons name={icon as any} size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ToolkitScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [personalizedToolkit, setPersonalizedToolkit] = useState<
    string[] | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDisaster, setActiveDisaster] = useState<string | null>(
    "hurricane"
  );
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const headerScale = useState(new Animated.Value(0.8))[0];

  const categories = [
    {
      id: "all",
      name: "All",
      icon: "📊",
      color: "#6366f1",
      gradient: ["#6366f1", "#8b5cf6"],
    },
    {
      id: "water",
      name: "Water",
      icon: "💧",
      color: "#3b82f6",
      gradient: ["#3b82f6", "#60a5fa"],
    },
    {
      id: "food",
      name: "Food",
      icon: "🍎",
      color: "#ef4444",
      gradient: ["#ef4444", "#f87171"],
    },
    {
      id: "safety",
      name: "Safety",
      icon: "🛡️",
      color: "#f59e0b",
      gradient: ["#f59e0b", "#fbbf24"],
    },
    {
      id: "health",
      name: "Health",
      icon: "🏥",
      color: "#10b981",
      gradient: ["#10b981", "#34d399"],
    },
    {
      id: "special_needs",
      name: "Special",
      icon: "👨‍👩‍👧‍👦",
      color: "#8b5cf6",
      gradient: ["#8b5cf6", "#a78bfa"],
    },
  ];

  // Filter items
  const allItems = [...checklistItems, ...customItems];
  const filteredItems =
    selectedCategory === "all"
      ? allItems
      : allItems.filter((item) => item.category === selectedCategory);

  // Progress (use only main checklist items for overall progress)
  const mainIds = checklistItems.map((item) => item.id);
  const mainCompleted = mainIds.filter((id) => completedItems.includes(id));
  const mainProgress =
    mainIds.length === 0 ? 0 : (mainCompleted.length / mainIds.length) * 100;
  const completedCount = mainCompleted.length;
  const totalCount = mainIds.length;

  // AI Recommended Progress
  const aiToolkitIds = (personalizedToolkit ?? []).map((item) => {
    const found = checklistItems.find((i) => i.title === item);
    return found ? found.id : `ai-${item.replace(/\s+/g, "-").toLowerCase()}`;
  });
  const aiCompleted = aiToolkitIds.filter((id) => completedItems.includes(id));
  const aiProgress =
    aiToolkitIds.length === 0
      ? 0
      : (aiCompleted.length / aiToolkitIds.length) * 100;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: aiProgress,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [aiProgress]);

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
      const item = checklistItems.find((i) => i.id === itemId);
      return sum + (item?.points || 0);
    }, 0);
    setUserPoints(points);

    const badges = getEarnedBadges({
      completedItems: completed,
      totalPoints: points,
    });
    setEarnedBadges(badges);
    setLoading(false);
  }, []);

  // Load AI toolkit
  useEffect(() => {
    loadProgress();
    (async () => {
      setAiLoading(true);

      // Load profile from AsyncStorage
      let userProfile = await AsyncStorage.getItem("householdProfile");
      let parsedProfile = userProfile ? JSON.parse(userProfile) : null;
      setProfile(parsedProfile);

      // Simulate AI loading
      setTimeout(() => {
        setPersonalizedToolkit([
          "Portable water filter",
          "Emergency radio with charging",
          "7-day medication supply",
          "Important documents waterproof case",
          "Family contact cards",
        ]);
        setAiLoading(false);
      }, 2000);
    })();
  }, [loadProgress, activeDisaster]);

  // Animate mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleItemCompletion = async (itemId: string) => {
    const isCompleted = completedItems.includes(itemId);
    const item = checklistItems.find((i) => i.id === itemId);
    if (!item) return;

    await updateChecklistItem(item.category, item.id, !isCompleted);
    await loadProgress(); // <-- This reloads progress after update

    if (!isCompleted) {
      Alert.alert(
        "Great Job! 🎉",
        `You completed "${item.title}" and earned ${item.points} points!`,
        [{ text: "Awesome!" }]
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "#dc2626";
      case "high":
        return "#ea580c";
      case "medium":
        return "#d97706";
      case "low":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return "⚡";
      case "high":
        return "🔥";
      case "medium":
        return "⚠️";
      case "low":
        return "💚";
      default:
        return "📌";
    }
  };

  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  // Load custom items from storage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("customChecklistItems");
      if (stored) setCustomItems(JSON.parse(stored));
    })();
  }, []);

  // Save custom items to storage
  const saveCustomItems = async (items: any[]) => {
    setCustomItems(items);
    await AsyncStorage.setItem("customChecklistItems", JSON.stringify(items));
  };

  // Add new custom item
  const addCustomItem = async () => {
    if (!newTitle.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: selectedCategory === "all" ? "custom" : selectedCategory,
      points: 5,
      priority: "low",
      estimatedTime: 5,
      custom: true,
    };
    const updated = [...customItems, newItem];
    await saveCustomItems(updated);
    setNewTitle("");
    setNewDesc("");
    setShowModal(false);
  };

  // Delete custom item
  const deleteCustomItem = async (id: string) => {
    const updated = customItems.filter((item) => item.id !== id);
    await saveCustomItems(updated);
  };

  // Custom Checklist Progress
  const customIds = customItems.map((item) => item.id);
  const customCompleted = customIds.filter((id) => completedItems.includes(id));
  const customProgress =
    customIds.length === 0
      ? 0
      : (customCompleted.length / customIds.length) * 100;

  // Main Checklist Progress (excluding custom)
  // Already declared above, so remove this duplicate block.

  const allTaskIds = [
    ...mainIds,
    ...aiToolkitIds.filter((id) => !mainIds.includes(id)), // avoid double-counting if AI items are in main
    ...customIds,
  ];
  const allCompleted = allTaskIds.filter((id) => completedItems.includes(id));
  const allProgress =
    allTaskIds.length === 0
      ? 0
      : (allCompleted.length / allTaskIds.length) * 100;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { transform: [{ scale: headerScale }] }]}
        >
          <View>
            <Text style={styles.greeting}>Emergency Preparedness</Text>
            <Text style={styles.subtitle}>Stay ready, stay safe</Text>
          </View>
        </Animated.View>

        {/* Emergency Alert */}
        {activeDisaster && (
          <Animated.View style={styles.emergencyBanner}>
            <LinearGradient
              colors={["#dc2626", "#ef4444"]}
              style={styles.emergencyGradient}
            >
              <View style={styles.emergencyContent}>
                <View style={styles.emergencyIconContainer}>
                  <Ionicons name="warning" size={24} color="#fff" />
                </View>
                <View style={styles.emergencyTextContainer}>
                  <Text style={styles.emergencyTitle}>
                    ACTIVE DISASTER ALERT
                  </Text>
                  <Text style={styles.emergencyText}>
                    {activeDisaster.charAt(0).toUpperCase() +
                      activeDisaster.slice(1)}{" "}
                    detected in your area
                  </Text>
                </View>
                <TouchableOpacity style={styles.emergencyAction}>
                  <Text style={styles.emergencyActionText}>VIEW</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* Progress Overview */}
          <View style={styles.progressOverview}>
            <LinearGradient
              colors={["#fff", "#f8fafc"]}
              style={styles.progressGradient}
            >
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Your Preparedness</Text>
                  <Text style={styles.progressSubtitle}>
                    {allCompleted.length} of {allTaskIds.length} items complete
                  </Text>
                </View>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressPercent}>
                    {Math.round(allProgress)}%
                  </Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6366f1",
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  Overall Progress: {allCompleted.length}/{allTaskIds.length} (
                  {Math.round(allProgress)}%)
                </Text>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", "100%"],
                        }),
                        backgroundColor:
                          selectedCategoryData?.color || "#6366f1",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Group Progress Summaries */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color="#7c3aed"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#7c3aed",
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    AI Recommended
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#7c3aed",
                      fontWeight: "700",
                    }}
                  >
                    {aiCompleted.length}/{aiToolkitIds.length} (
                    {Math.round(aiProgress)}%)
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#ede9fe",
                    borderRadius: 3,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${aiProgress}%`,
                      height: "100%",
                      backgroundColor: "#7c3aed",
                      borderRadius: 3,
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="create"
                    size={16}
                    color="#10b981"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#10b981",
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    Custom
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#10b981",
                      fontWeight: "700",
                    }}
                  >
                    {customCompleted.length}/{customIds.length} (
                    {Math.round(customProgress)}%)
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#d1fae5",
                    borderRadius: 3,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: `${customProgress}%`,
                      height: "100%",
                      backgroundColor: "#10b981",
                      borderRadius: 3,
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="list"
                    size={16}
                    color="#6366f1"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#6366f1",
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    Preparedness
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#6366f1",
                      fontWeight: "700",
                    }}
                  >
                    {mainCompleted.length}/{mainIds.length} (
                    {Math.round(mainProgress)}%)
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#e0e7ff",
                    borderRadius: 3,
                  }}
                >
                  <View
                    style={{
                      width: `${mainProgress}%`,
                      height: "100%",
                      backgroundColor: "#6366f1",
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {[
              {
                icon: "people",
                label: "Household",
                route: "/toolKit/household-setup",
                color: "#3b82f6",
              },
              {
                icon: "book",
                label: "Learn",
                route: "/toolKit/education",
                color: "#10b981",
              },
              {
                icon: "trophy",
                label: "Badges",
                route: "/toolKit/achievements",
                color: "#f59e0b",
              },
              {
                icon: "game-controller",
                label: "Simulate",
                route: "/toolKit/simulations",
                color: "#8b5cf6",
              },
            ].map((action, index) => (
              <Animated.View
                key={action.label}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50 * (index + 1), 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => router.push(action.route as any)}
                >
                  <LinearGradient
                    colors={[action.color, `${action.color}dd`]}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={24}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* AI Recommended Section */}
          {profile?.householdCompleted ? (
            <ExpandableCard
              title="AI Recommended Toolkit"
              icon="✨"
              color="#7c3aed"
              defaultExpanded
            >
              {/* Progress Bar */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#7c3aed",
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  {aiCompleted.length} of {aiToolkitIds.length} items complete (
                  {Math.round(aiProgress)}%)
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#ede9fe",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${aiProgress}%`,
                      height: "100%",
                      backgroundColor: "#7c3aed",
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
              <Text style={styles.aiSubtitle}>
                Personalized for your household and location
              </Text>
              {aiLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#7c3aed" />
                  <Text style={styles.loadingText}>
                    Analyzing your profile for recommendations...
                  </Text>
                </View>
              ) : (
                <View style={styles.checklistItems}>
                  {personalizedToolkit?.map((item, idx) => {
                    // Try to find in main checklist, else treat as AI-only
                    const found = checklistItems.find((i) => i.title === item);
                    const id = found
                      ? found.id
                      : `ai-${item.replace(/\s+/g, "-").toLowerCase()}`;
                    const isCompleted = completedItems.includes(id);

                    return (
                      <Animated.View
                        key={id}
                        style={[
                          styles.itemCard,
                          isCompleted && styles.itemCardCompleted,
                          { opacity: 1, transform: [{ translateY: 0 }] },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={async () => {
                            let updatedCompleted = [...completedItems];
                            if (isCompleted) {
                              updatedCompleted = updatedCompleted.filter(
                                (cid) => cid !== id
                              );
                            } else {
                              updatedCompleted.push(id);
                            }
                            setCompletedItems(updatedCompleted);
                            await AsyncStorage.setItem(
                              "completedItems",
                              JSON.stringify(updatedCompleted)
                            );
                          }}
                          activeOpacity={0.7}
                          style={styles.itemTouchable}
                        >
                          <LinearGradient
                            colors={
                              isCompleted
                                ? ["#f0fdf4", "#dcfce7"]
                                : ["#fff", "#f8fafc"]
                            }
                            style={styles.itemGradient}
                          >
                            <View
                              style={[
                                styles.completionIndicator,
                                isCompleted &&
                                  styles.completionIndicatorCompleted,
                              ]}
                            >
                              {isCompleted && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#fff"
                                />
                              )}
                            </View>
                            <View style={styles.itemContent}>
                              <View style={styles.itemHeader}>
                                <Text
                                  style={[
                                    styles.itemTitle,
                                    isCompleted && styles.itemTitleCompleted,
                                  ]}
                                >
                                  {item}
                                </Text>
                              </View>
                              <Text style={styles.itemDescription}>
                                {found
                                  ? found.description
                                  : "AI suggested item"}
                              </Text>
                            </View>
                            {isCompleted && (
                              <LinearGradient
                                colors={["#10b981", "#059669"]}
                                style={styles.completedRibbon}
                              >
                                <Ionicons
                                  name="trophy"
                                  size={12}
                                  color="#fff"
                                />
                                <Text style={styles.completedText}>
                                  {found ? `+${found.points}pts` : ""}
                                </Text>
                              </LinearGradient>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </ExpandableCard>
          ) : (
            <ExpandableCard
              title="AI Recommended Toolkit"
              icon="✨"
              color="#7c3aed"
              defaultExpanded
            >
              <View style={{ alignItems: "center", padding: 16 }}>
                <Ionicons
                  name="information-circle"
                  size={32}
                  color="#7c3aed"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: "#7c3aed",
                    fontWeight: "700",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Complete your household profile to unlock personalized AI
                  recommendations!
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#7c3aed",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                    marginTop: 8,
                  }}
                  onPress={() => router.push("/toolKit/household-setup")}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                  >
                    Complete Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </ExpandableCard>
          )}

          {/* User Custom Checklist Section */}
          {customItems.length > 0 && (
            <ExpandableCard
              title="Your Custom Checklist"
              icon="📝"
              color="#10b981"
              defaultExpanded
            >
              {/* Progress Bar */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#10b981",
                    fontWeight: "700",
                    marginBottom: 4,
                  }}
                >
                  {customCompleted.length} of {customIds.length} items complete
                  ({Math.round(customProgress)}%)
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: "#d1fae5",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${customProgress}%`,
                      height: "100%",
                      backgroundColor: "#10b981",
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
              <View style={styles.checklistItems}>
                {customItems.map((item, index) => {
                  const isCompleted = completedItems.includes(item.id);
                  return (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.itemCard,
                        isCompleted && styles.itemCardCompleted,
                        {
                          opacity: 1,
                          transform: [{ translateY: 0 }],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={async () => {
                          let updatedCompleted = [...completedItems];
                          if (isCompleted) {
                            updatedCompleted = updatedCompleted.filter(
                              (cid) => cid !== item.id
                            );
                          } else {
                            updatedCompleted.push(item.id);
                          }
                          setCompletedItems(updatedCompleted);
                          await AsyncStorage.setItem(
                            "completedItems",
                            JSON.stringify(updatedCompleted)
                          );
                        }}
                        onLongPress={() => {
                          Alert.alert(
                            "Delete Custom Item?",
                            "Are you sure you want to delete this custom item?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deleteCustomItem(item.id),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.7}
                        style={styles.itemTouchable}
                      >
                        <LinearGradient
                          colors={
                            isCompleted
                              ? ["#f0fdf4", "#dcfce7"]
                              : ["#fff", "#f8fafc"]
                          }
                          style={styles.itemGradient}
                        >
                          <View
                            style={[
                              styles.completionIndicator,
                              isCompleted &&
                                styles.completionIndicatorCompleted,
                            ]}
                          >
                            {isCompleted && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#fff"
                              />
                            )}
                          </View>
                          <View style={styles.itemContent}>
                            <View style={styles.itemHeader}>
                              <Text
                                style={[
                                  styles.itemTitle,
                                  isCompleted && styles.itemTitleCompleted,
                                ]}
                              >
                                {item.title}
                              </Text>
                            </View>
                            <Text style={styles.itemDescription}>
                              {item.description}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </ExpandableCard>
          )}

          {/* Preparedness Checklist */}
          <ExpandableCard
            title="Complete Preparedness Checklist"
            icon="📋"
            color="#6366f1"
            defaultExpanded
          >
            {/* Progress Bar */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6366f1",
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                {mainCompleted.length} of {mainIds.length} items complete (
                {Math.round(mainProgress)}%)
              </Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: "#e0e7ff",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${mainProgress}%`,
                    height: "100%",
                    backgroundColor: "#6366f1",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
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
                        ? (category.gradient as [string, string])
                        : (["#f8fafc", "#f1f5f9"] as [string, string])
                    }
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id &&
                        styles.categoryButtonSelected,
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.id &&
                          styles.categoryTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Checklist Items */}
            <View style={styles.checklistItems}>
              {filteredItems
                .filter((item) => !item.custom) // Only show main checklist here
                .map((item, index) => {
                  const isCompleted = completedItems.includes(item.id);
                  return (
                    <Animated.View
                      key={item.id}
                      style={[
                        styles.itemCard,
                        isCompleted && styles.itemCardCompleted,
                        {
                          opacity: 1,
                          transform: [{ translateY: 0 }],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={async () => {
                          let updatedCompleted = [...completedItems];
                          if (isCompleted) {
                            updatedCompleted = updatedCompleted.filter(
                              (cid) => cid !== item.id
                            );
                          } else {
                            updatedCompleted.push(item.id);
                          }
                          setCompletedItems(updatedCompleted);
                          await AsyncStorage.setItem(
                            "completedItems",
                            JSON.stringify(updatedCompleted)
                          );
                          // Optionally call toggleItemCompletion(item.id) if you want to keep points/badges logic
                        }}
                        activeOpacity={0.7}
                        style={styles.itemTouchable}
                      >
                        <LinearGradient
                          colors={
                            isCompleted
                              ? ["#f0fdf4", "#dcfce7"]
                              : ["#fff", "#f8fafc"]
                          }
                          style={styles.itemGradient}
                        >
                          <View
                            style={[
                              styles.completionIndicator,
                              isCompleted &&
                                styles.completionIndicatorCompleted,
                            ]}
                          >
                            {isCompleted && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#fff"
                              />
                            )}
                          </View>
                          <View style={styles.itemContent}>
                            <View style={styles.itemHeader}>
                              <Text
                                style={[
                                  styles.itemTitle,
                                  isCompleted && styles.itemTitleCompleted,
                                ]}
                              >
                                {item.title}
                              </Text>
                              <View
                                style={[
                                  styles.priorityBadge,
                                  {
                                    backgroundColor: getPriorityColor(
                                      item.priority
                                    ),
                                  },
                                ]}
                              >
                                <Text style={styles.priorityIcon}>
                                  {getPriorityIcon(item.priority)}
                                </Text>
                                <Text style={styles.priorityText}>
                                  {item.priority}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.itemDescription}>
                              {item.description}
                            </Text>
                          </View>
                          {isCompleted && (
                            <LinearGradient
                              colors={["#10b981", "#059669"]}
                              style={styles.completedRibbon}
                            >
                              <Ionicons name="trophy" size={12} color="#fff" />
                              <Text style={styles.completedText}>
                                +{item.points}pts
                              </Text>
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
        {/* Move FAB here, inside Animated.View but after ScrollView */}
        <FloatingActionButton
          onPress={() => setShowModal(true)}
          icon="add"
          color="#6366f1"
        />
      </Animated.View>

      {/* Add Custom Item Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              width: width * 0.85,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
              Add Custom Checklist Item
            </Text>
            <TextInput
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                padding: 10,
                marginBottom: 12,
              }}
            />
            <TextInput
              placeholder="Description"
              value={newDesc}
              onChangeText={setNewDesc}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                padding: 10,
                marginBottom: 16,
                minHeight: 40,
              }}
              multiline
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text
                  style={{ color: "#6b7280", fontWeight: "600", fontSize: 16 }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addCustomItem}>
                <Text
                  style={{ color: "#6366f1", fontWeight: "700", fontSize: 16 }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    position: "relative", // <-- ensure relative positioning
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgCircle: {
    position: "absolute",
    borderRadius: 500,
    opacity: 0.1,
  },
  bgCircle1: {
    width: 300,
    height: 300,
    backgroundColor: "#6366f1",
    top: -150,
    right: -100,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    backgroundColor: "#10b981",
    bottom: -50,
    left: -50,
  },
  bgCircle3: {
    width: 150,
    height: 150,
    backgroundColor: "#f59e0b",
    top: "30%",
    right: "20%",
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  profileButton: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyBanner: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  emergencyGradient: {
    borderRadius: 20,
    padding: 4,
  },
  emergencyContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(220, 38, 38, 0.95)",
  },
  emergencyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 2,
  },
  emergencyText: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.9,
  },
  emergencyAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  emergencyActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  progressOverview: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: "#000",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercent: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 24,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: "center",
    flex: 1,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  expandableCard: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  expandableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderLeftWidth: 4,
  },
  expandableTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expandableIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  expandableTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  expandableContent: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  aiSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  aiChecklistItems: {
    gap: 8,
  },
  aiChecklistItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  aiChecklistGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  aiChecklistItemCompleted: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiChecklistText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    fontWeight: "500",
  },
  aiChecklistTextCompleted: {
    color: "#fff",
    fontWeight: "600",
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingRight: 8,
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonSelected: {
    shadowColor: "#000",
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
    color: "#6b7280",
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  checklistItems: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardCompleted: {
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  itemTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  itemGradient: {
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  completionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  completionIndicatorCompleted: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityIcon: {
    fontSize: 10,
  },
  priorityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  itemDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  specialNeeds: {
    flexDirection: "row",
    gap: 6,
  },
  specialNeedTag: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialNeedText: {
    fontSize: 10,
    color: "#6366f1",
    fontWeight: "600",
  },
  completedRibbon: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20, // <-- increase elevation for Android
    zIndex: 100, // <-- add zIndex for iOS/web
  },
});

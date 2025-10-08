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
import { getUserProgress, updateChecklistItem, saveAiRecommendation, getAiRecommendation } from "@/utils/storage";
import { getUserProfile } from "../../utils/profile";
import { getPersonalizedToolkit } from "../../utils/gemini";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { firestoreService } from "@/utils/firestoreService";
import { useAuth } from '@/context/AuthContext';

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
  const { user, isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [personalizedToolkit, setPersonalizedToolkit] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeDisaster, setActiveDisaster] = useState<string | null>("hurricane");
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");

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

  // Custom Checklist Progress
  const customIds = customItems.map((item) => item.id);
  const customCompleted = customIds.filter((id) => completedItems.includes(id));
  const customProgress =
    customIds.length === 0
      ? 0
      : (customCompleted.length / customIds.length) * 100;

  const allTaskIds = [
    ...mainIds,
    ...aiToolkitIds.filter((id) => !mainIds.includes(id)),
    ...customIds,
  ];
  const allCompleted = allTaskIds.filter((id) => completedItems.includes(id));
  const allProgress =
    allTaskIds.length === 0
      ? 0
      : (allCompleted.length / allTaskIds.length) * 100;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: aiProgress,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [aiProgress]);

  // Updated loadProgress function
  const loadProgress = useCallback(async () => {
    setLoading(true);
    setStorageError(false);
    
    try {
      if (isLoggedIn && user) {
        // Use Firestore for authenticated users
        const userProgress = await firestoreService.getUserProgress();
        setCompletedItems(userProgress.completedItems);
        setUserPoints(userProgress.points);
        setEarnedBadges(userProgress.badges || []);

        const customItemsData = await firestoreService.getCustomItems();
        setCustomItems(customItemsData);
        setSyncStatus("synced");
      } else {
        // Use local storage for unauthenticated users
        const userProgress = await getUserProgress();
        setCompletedItems(userProgress.completedItems);
        setUserPoints(userProgress.points);

        const badges = getEarnedBadges({
          completedItems: userProgress.completedItems,
          totalPoints: userProgress.points,
        });
        setEarnedBadges(badges);

        const customItemsData = await AsyncStorage.getItem('customChecklistItems');
        setCustomItems(customItemsData ? JSON.parse(customItemsData) : []);
        setSyncStatus("synced");
      }
    } catch (error) {
      console.error("Error loading progress:", error);
      setStorageError(true);
      setSyncStatus("offline");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  // Setup real-time listeners when user is authenticated
  useEffect(() => {
    if (isLoggedIn && user) {
      const unsubscribeProgress = firestoreService.subscribeToUserProgress((progress) => {
        setCompletedItems(progress.completedItems);
        setUserPoints(progress.points);
        setEarnedBadges(progress.badges || []);
        setSyncStatus("synced");
      });

      const unsubscribeCustomItems = firestoreService.subscribeToCustomItems((items) => {
        setCustomItems(items);
        setSyncStatus("synced");
      });

      return () => {
        unsubscribeProgress();
        unsubscribeCustomItems();
      };
    }
  }, [isLoggedIn, user]);

  // Migrate data when user logs in
  useEffect(() => {
    const migrateData = async () => {
      if (isLoggedIn && user) {
        setMigrating(true);
        await firestoreService.migrateLocalDataToFirestore();
        setMigrating(false);
        loadProgress();
      }
    };

    migrateData();
  }, [isLoggedIn, user]);

  // Updated toggle function
  const toggleItemCompletion = async (itemId: string, category?: string) => {
    const isCompleted = completedItems.includes(itemId);
    
    // Update state immediately for better UX
    setCompletedItems(prev => 
      isCompleted 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );

    try {
      if (isLoggedIn && user) {
        // Use Firestore for authenticated users
        setSyncStatus("syncing");
        const success = await firestoreService.updateChecklistItem({
          itemId,
          category,
          completed: !isCompleted,
        });

        if (!success) {
          throw new Error('Failed to update item in Firestore');
        }
        setSyncStatus("synced");
      } else {
        // Use local storage for unauthenticated users
        let updatedCompleted = [...completedItems];
        if (isCompleted) {
          updatedCompleted = updatedCompleted.filter((cid) => cid !== itemId);
        } else {
          updatedCompleted.push(itemId);
        }
        
        await AsyncStorage.setItem('completedItems', JSON.stringify(updatedCompleted));
        
        // Also update through your existing storage system for points calculation
        if (category) {
          await updateChecklistItem(category, itemId, !isCompleted);
        }
      }

      // Show points alert for main checklist items
      if (!isCompleted && category) {
        const item = checklistItems.find((i) => i.id === itemId);
        if (item) {
          Alert.alert(
            "Great Job! 🎉",
            `You completed "${item.title}" and earned ${item.points} points!`,
            [{ text: "Awesome!" }]
          );
        }
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      // Revert state on error
      setCompletedItems(completedItems);
      setSyncStatus("offline");
      Alert.alert("Error", "Failed to save progress. Please check your connection.");
    }
  };

  // Updated addCustomItem function
  const addCustomItem = async () => {
    if (!newTitle.trim()) return;

    const newItem = {
      title: newTitle,
      description: newDesc,
      category: selectedCategory === "all" ? "custom" : selectedCategory,
      points: 5,
      priority: "low" as const,
      estimatedTime: 5,
      difficulty: "easy" as const,
      custom: true,
    };

    try {
      if (isLoggedIn && user) {
        setSyncStatus("syncing");
        await firestoreService.saveCustomItem(newItem);
        setSyncStatus("synced");
      } else {
        // Fallback to local storage
        const localItemsJson = await AsyncStorage.getItem('customChecklistItems');
        const localItems = localItemsJson ? JSON.parse(localItemsJson) : [];
        const customItem = {
          ...newItem,
          id: `custom-${Date.now()}`,
        };
        const updatedItems = [...localItems, customItem];
        await AsyncStorage.setItem('customChecklistItems', JSON.stringify(updatedItems));
        setCustomItems(updatedItems);
      }

      setNewTitle("");
      setNewDesc("");
      setShowModal(false);
      Alert.alert("Success", "Custom item added!");
    } catch (error) {
      console.error("Error adding custom item:", error);
      setSyncStatus("offline");
      Alert.alert("Error", "Failed to add custom item");
    }
  };

  // Updated deleteCustomItem function
  const deleteCustomItem = async (id: string) => {
    try {
      if (isLoggedIn && user) {
        setSyncStatus("syncing");
        await firestoreService.deleteCustomItem(id);
        setSyncStatus("synced");
      } else {
        // Fallback to local storage
        const localItemsJson = await AsyncStorage.getItem('customChecklistItems');
        const localItems = localItemsJson ? JSON.parse(localItemsJson) : [];
        const updatedItems = localItems.filter((item: any) => item.id !== id);
        await AsyncStorage.setItem('customChecklistItems', JSON.stringify(updatedItems));
        setCustomItems(updatedItems);
      }
    } catch (error) {
      console.error("Error deleting custom item:", error);
      setSyncStatus("offline");
      Alert.alert("Error", "Failed to delete custom item");
    }
  };

  // Load AI toolkit
  useEffect(() => {
    (async () => {
      setAiLoading(true);
      let userProfile = await AsyncStorage.getItem("householdProfile");
      let parsedProfile = userProfile ? JSON.parse(userProfile) : null;
      setProfile(parsedProfile);

      if (parsedProfile?.householdCompleted) {
        const cached = await getAiRecommendation();
        if (cached) {
          setPersonalizedToolkit(JSON.parse(cached));
          setAiLoading(false);
          return;
        }
        try {
          const recommendations = await getPersonalizedToolkit(parsedProfile, activeDisaster ?? undefined);
          setPersonalizedToolkit(recommendations);
          await saveAiRecommendation(JSON.stringify(recommendations));
        } catch (error) {
          setPersonalizedToolkit([]);
        }
      } else {
        setPersonalizedToolkit([]);
      }
      setAiLoading(false);
    })();
  }, [activeDisaster]);

  // Load progress when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

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

  // Sync status indicator
  const renderSyncStatus = () => {
    let icon, color, text;
    
    switch (syncStatus) {
      case "synced":
        icon = "checkmark-circle";
        color = "#10b981";
        text = "Synced";
        break;
      case "syncing":
        icon = "sync";
        color = "#f59e0b";
        text = "Syncing...";
        break;
      case "offline":
        icon = "cloud-offline";
        color = "#ef4444";
        text = "Offline";
        break;
    }

    return (
      <View style={styles.syncStatus}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={[styles.syncStatusText, { color }]}>{text}</Text>
      </View>
    );
  };

  // Add migration indicator
  if (migrating) {
    return (
      <View style={styles.container}>
        <View style={styles.migrationContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.migrationTitle}>Migrating Your Data</Text>
          <Text style={styles.migrationText}>
            We're moving your checklist progress to the cloud so you can access it from any device.
          </Text>
          <Text style={styles.migrationSubtext}>This will only take a moment...</Text>
        </View>
      </View>
    );
  }

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
          <View style={styles.headerRight}>
            {renderSyncStatus()}
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
                    {isLoggedIn && " • Cloud Synced"}
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
                          onPress={() => {
                            const found = checklistItems.find((i) => i.title === item);
                            if (found) {
                              toggleItemCompletion(found.id, found.category);
                            } else {
                              // For AI-only items, just use AsyncStorage
                              const id = `ai-${item.replace(/\s+/g, "-").toLowerCase()}`;
                              toggleItemCompletion(id);
                            }
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
                        onPress={() => toggleItemCompletion(item.id)}
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
                        onPress={() => toggleItemCompletion(item.id, item.category)}
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

        {/* Floating Action Button */}
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
    position: "relative",
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
  headerRight: {
    alignItems: "flex-end",
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
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: "600",
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
    elevation: 20,
    zIndex: 100,
  },
  migrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  migrationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  migrationText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  migrationSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});
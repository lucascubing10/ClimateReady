import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp, FadeIn, ZoomIn, ZoomInEasyDown, SlideInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const [score, setScore] = useState(65); // Preparedness score mock

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header with background and logo */}
      <Animated.View entering={FadeInDown.duration(700)} style={styles.heroHeader}>
        <View style={styles.heroBg}>
          <Image source={require("@/assets/images/ClimateReady v2.png")} style={styles.heroImage} resizeMode="contain" />
        </View>
        <Text style={styles.title}>🌍 ClimateReady</Text>
        <Text style={styles.subtitle}>Be prepared. Stay safe. Protect your community.</Text>
      </Animated.View>

      {/* Preparedness Score with animated ring */}
      <Animated.View entering={ZoomIn.duration(600)} style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Preparedness Score</Text>
        <View style={styles.scoreCircleWrap}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.scoreCircleGlow} />
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{score}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
        </View>
      </Animated.View>

      {/* Quick Actions with more color and animation */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.grid}>
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.gridItemWrap}>
          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: "#e0f2fe" }]}
            onPress={() => navigation.navigate("toolKit")}
          >
            <Ionicons name="checkbox-outline" size={30} color="#0284c7" />
            <Text style={styles.gridText}>Toolkit</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.gridItemWrap}>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: "#ffe4e6" }]}
            onPress={() => {}}>
            <Ionicons name="notifications" size={30} color="#e53935" />
            <Text style={styles.gridText}>Alerts</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.gridItemWrap}>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: "#e0ffe6" }]}
            onPress={() => {}}>
            <MaterialCommunityIcons name="map-marker-check" size={30} color="#43a047" />
            <Text style={styles.gridText}>Safe Zones</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.gridItemWrap}>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: "#fff7e6" }]}
            onPress={() => {}}>
            <Ionicons name="chatbubbles" size={30} color="#ff9800" />
            <Text style={styles.gridText}>Community</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Recent Alerts with icons and color */}
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      <Animated.View entering={SlideInDown.delay(100).duration(400)} style={[styles.alertCard, { borderLeftColor: "#e53935", borderLeftWidth: 4 }]}> 
        <Ionicons name="warning" size={22} color="#e53935" />
        <Text style={styles.alertText}>⚠️ Heatwave warning in your area</Text>
      </Animated.View>
      <Animated.View entering={SlideInDown.delay(200).duration(400)} style={[styles.alertCard, { borderLeftColor: "#2196f3", borderLeftWidth: 4 }]}> 
        <Ionicons name="rainy" size={22} color="#2196f3" />
        <Text style={styles.alertText}>Heavy rainfall expected tomorrow</Text>
      </Animated.View>
      <Animated.View entering={SlideInDown.delay(300).duration(400)} style={[styles.alertCard, { borderLeftColor: "#43a047", borderLeftWidth: 4 }]}> 
        <Ionicons name="leaf" size={22} color="#43a047" />
        <Text style={styles.alertText}>Air quality is good today</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    padding: 0,
  },
  heroHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
    paddingBottom: 18,
    backgroundColor: "#e0f2fe",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 10,
    shadowColor: "#0284c7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBg: {
    width: width * 0.32,
    height: width * 0.32,
    backgroundColor: "#bae6fd",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#0284c7",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  heroImage: {
    width: "80%",
    height: "80%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0284c7",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  scoreCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#0284c7",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
    marginHorizontal: 18,
  },
  scoreLabel: { fontSize: 15, color: "#0284c7", marginBottom: 10, fontWeight: "600" },
  scoreCircleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 2,
  },
  scoreCircleGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#bae6fd",
    opacity: 0.5,
    zIndex: 0,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 7,
    borderColor: "#0284c7",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    zIndex: 1,
  },
  scoreText: { fontSize: 32, fontWeight: "bold", color: "#0284c7" },
  scoreUnit: { fontSize: 13, color: "#64748b" },
  sectionTitle: { fontSize: 19, fontWeight: "700", marginBottom: 12, marginLeft: 18, color: "#1e293b" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 10,
  },
  gridItemWrap: {
    width: "48%",
    marginBottom: 16,
  },
  gridItem: {
    width: "100%",
    backgroundColor: "white",
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0284c7",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridText: { marginTop: 10, fontSize: 15, fontWeight: "600", color: "#222" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 18,
    shadowColor: "#0284c7",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
  },
  alertText: { marginLeft: 12, fontSize: 15, color: "#1e293b", fontWeight: "500" },
});

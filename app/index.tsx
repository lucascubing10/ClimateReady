import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HomeScreen({ navigation }: any) {
  const [score, setScore] = useState(65); // Preparedness score mock

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 ClimateReady</Text>
        <Text style={styles.subtitle}>“Be prepared. Stay safe.”</Text>
      </View>

      {/* Preparedness Score */}
      <Animated.View
        entering={FadeInDown.duration(600)}
        style={styles.scoreCard}
      >
        <Text style={styles.scoreLabel}>Preparedness Score</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreUnit}>/100</Text>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => navigation.navigate("toolkit")}
        >
          <Ionicons name="checkbox-outline" size={28} color="#007bff" />
          <Text style={styles.gridText}>Toolkit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="notifications" size={28} color="#e53935" />
          <Text style={styles.gridText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <MaterialCommunityIcons name="map-marker-check" size={28} color="#43a047" />
          <Text style={styles.gridText}>Safe Zones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem}>
          <Ionicons name="chatbubbles" size={28} color="#ff9800" />
          <Text style={styles.gridText}>Community</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Alerts */}
      <Text style={styles.sectionTitle}>Recent Alerts</Text>
      <View style={styles.alertCard}>
        <Ionicons name="warning" size={20} color="#e53935" />
        <Text style={styles.alertText}>⚠️ Heatwave warning in your area</Text>
      </View>
      <View style={styles.alertCard}>
        <Ionicons name="rainy" size={20} color="#2196f3" />
        <Text style={styles.alertText}>Heavy rainfall expected tomorrow</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#222" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  scoreCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
  },
  scoreLabel: { fontSize: 14, color: "#666", marginBottom: 8 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: { fontSize: 28, fontWeight: "bold", color: "#007bff" },
  scoreUnit: { fontSize: 12, color: "#666" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: {
    width: "47%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridText: { marginTop: 8, fontSize: 14, fontWeight: "500", color: "#333" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertText: { marginLeft: 10, fontSize: 14, color: "#333" },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChecklistSection from '@/components/Toolkit/ChecklistSection';
import EducationalContent from '@/components/Toolkit/EducationalContent';
import BadgesSection from '@/components/Toolkit/BadgesSection';

const ToolkitScreen = () => {
  const [activeTab, setActiveTab] = useState('checklists');

  const renderContent = () => {
    switch (activeTab) {
      case 'checklists':
        return <ChecklistSection />;
      case 'education':
        return <EducationalContent />;
      case 'badges':
        return <BadgesSection />;
      default:
        return <ChecklistSection />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Preparedness Toolkit</Text>
        <Text style={styles.subtitle}>Be ready for any emergency</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'checklists' && styles.activeTab]} 
          onPress={() => setActiveTab('checklists')}
        >
          <Text style={[styles.tabText, activeTab === 'checklists' && styles.activeTabText]}>Checklists</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'education' && styles.activeTab]} 
          onPress={() => setActiveTab('education')}
        >
          <Text style={[styles.tabText, activeTab === 'education' && styles.activeTabText]}>Education</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'badges' && styles.activeTab]} 
          onPress={() => setActiveTab('badges')}
        >
          <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>Badges</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
});

export default ToolkitScreen;
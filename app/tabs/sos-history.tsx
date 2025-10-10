import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface SOSHistoryItem {
  id: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in minutes
  location?: {
    latitude: number;
    longitude: number;
  };
  accessCount?: number;
  lastAccessTime?: Timestamp;
}

export default function SOSHistoryScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<SOSHistoryItem[]>([]);

  const decodedReturnTo = useMemo(() => {
    if (typeof returnTo === 'string' && returnTo.length > 0) {
      try {
        const decoded = decodeURIComponent(returnTo);
        return decoded.startsWith('/') ? decoded : `/${decoded}`;
      } catch (error) {
        return returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
      }
    }
    return undefined;
  }, [returnTo]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (decodedReturnTo) {
      router.replace(decodedReturnTo as any);
      return;
    }

    router.replace('/tabs/settings');
  }, [router, decodedReturnTo]);

  useEffect(() => {
    const loadSOSHistory = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Query for all SOS sessions for current user
        const sosQuery = query(
          collection(db, 'sos_sessions'),
          where('userId', '==', user.uid),
          orderBy('startTime', 'desc')
        );
        
        const querySnapshot = await getDocs(sosQuery);
        const history: SOSHistoryItem[] = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          
          // Calculate duration if session has ended
          let duration;
          if (data.endTime && data.startTime) {
            const start = data.startTime.toDate();
            const end = data.endTime.toDate();
            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // duration in minutes
          }
          
          history.push({
            id: doc.id,
            startTime: data.startTime,
            endTime: data.endTime,
            duration,
            location: data.location,
            accessCount: data.accessLogs?.length || 0,
            lastAccessTime: data.accessLogs?.length ? 
              data.accessLogs[data.accessLogs.length - 1].timestamp : undefined
          });
        });
        
        setHistoryItems(history);
      } catch (error) {
        console.error('Error loading SOS history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSOSHistory();
  }, [user]);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderHistoryItem = ({ item }: { item: SOSHistoryItem }) => {
    const isActive = !item.endTime;
    
    return (
      <View style={[styles.historyItem, isActive ? styles.activeItem : {}]}>
        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        )}
        
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>{formatDate(item.startTime)}</Text>
          {item.duration !== undefined && (
            <Text style={styles.durationText}>{item.duration} min</Text>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.location ? 
                `Lat: ${item.location.latitude.toFixed(4)}, Lng: ${item.location.longitude.toFixed(4)}` : 
                'No location data'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="eye" size={18} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.accessCount} views
              {item.lastAccessTime ? ` (last: ${formatDate(item.lastAccessTime)})` : ''}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#0284c7" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'SOS History', 
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#1f2937" />
              </TouchableOpacity>
            ),
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading your SOS history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'SOS History', 
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#1f2937" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No SOS History</Text>
          <Text style={styles.emptyText}>
            You haven't used the SOS feature yet. When you activate SOS, your history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyItems}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  headerButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginLeft: 12,
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  activeItem: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0284c7',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
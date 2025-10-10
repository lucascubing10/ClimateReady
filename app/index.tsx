import React, { useEffect, useState, useCallback, JSX, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { 
  FadeInUp, 
  FadeInRight,
  SlideInDown,
  ZoomIn,
  BounceIn,
  LightSpeedInLeft,
  FlipInYLeft
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { getUserProfile } from '@/utils/userProfile';
import { getPersonalizedToolkit } from '@/utils/gemini';
import { getEducationalProgress } from '@/utils/educationalData';
import { GameStorage } from '@/utils/gameStorage';
import { getEarnedBadges } from '@/utils/badges';
import { getCustomItems, getAiRecommendation } from '@/utils/storage';
import LottieView from 'lottie-react-native';
import { evaluateForecast, defaultThresholds } from '@/utils/alerts/weatherThresholds';
import { ensurePermissionsAsync, ensureAndroidChannelAsync, sendLocalNotification } from '@/utils/notifications';

const { width } = Dimensions.get('window');

// Color palette
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const YELLOW_GRADIENT = ['#fac609', '#e6b408'];
const ORANGE = '#e5793a';
const ORANGE_GRADIENT = ['#e5793a', '#d4692a'];
const RED = '#ef4444';
const RED_GRADIENT = ['#ef4444', '#dc2626'];
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

const quickActions: {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  bgColor: string;
  gradient: string[];
  screen: 'safe-zone' | 'toolkit' | 'community' | 'mock-alerts';
}[] = [
  {
    title: 'Safe Zones',
    subtitle: 'Find nearby shelters',
    icon: <Ionicons name="map" size={24} color="#fff" />,
    bgColor: PRIMARY,
    gradient: PRIMARY_GRADIENT,
    screen: 'safe-zone',
  },
  {
    title: 'Toolkit',
    subtitle: 'Emergency checklists',
    icon: <Feather name="package" size={24} color="#fff" />,
    bgColor: YELLOW,
    gradient: YELLOW_GRADIENT,
    screen: 'toolkit',
  },
  {
    title: 'Community',
    subtitle: 'Connect with others',
    icon: <Ionicons name="people" size={24} color="#fff" />,
    bgColor: ORANGE,
    gradient: ORANGE_GRADIENT,
    screen: 'community',
  },
  {
    title: 'Mock Alerts',
    subtitle: 'Test alert notifications',
    icon: <Ionicons name="warning" size={24} color="#fff" />,
    bgColor: RED,
    gradient: RED_GRADIENT,
    screen: 'mock-alerts',
  },
];

// Alerts will be sourced from forecast triggers; no hardcoded alerts

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  location: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

// Reusable Card Component
const Card = ({ children, style, gradient, onPress }: any) => {
  const content = (
    <Animated.View style={[styles.card, style]}>
      {children}
    </Animated.View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={gradient as [ColorValue, ColorValue, ...ColorValue[]]} style={[styles.card, style]}>
        {children}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return content;
};

// Modern Progress Ring Component
const ProgressRing = ({ progress, size = 70, strokeWidth = 8, label, value }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View 
        style={[
          styles.progressRingBackground,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          }
        ]} 
      />
      
      {/* Progress Circle */}
      <View 
        style={[
          styles.progressRingFill,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderLeftColor: PRIMARY,
            borderBottomColor: PRIMARY,
            transform: [{ rotate: `${-45 + (progress * 3.6)}deg` }],
          }
        ]} 
      />
      
      {/* Center Content */}
      <View style={styles.progressRingContent}>
        <Text style={styles.progressRingPercent}>{Math.round(progress)}%</Text>
        {label && <Text style={styles.progressRingLabel}>{label}</Text>}
        {value && <Text style={styles.progressRingValue}>{value}</Text>}
      </View>
    </View>
  );
};

// Modern Badge Component
const Badge = ({ count, style }: any) => (
  <Animated.View 
    entering={BounceIn.duration(600)}
    style={[styles.badge, style]}
  >
    <Text style={styles.badgeText}>{count}</Text>
  </Animated.View>
);

// Progress Item Component
const ProgressItem = ({ title, subtitle, progress, icon, color = PRIMARY }: any) => (
  <Animated.View 
    entering={FadeInRight.duration(500)}
    style={styles.progressItem}
  >
    <View style={styles.progressItemLeft}>
      <View style={[styles.progressIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <View style={styles.progressText}>
        <Text style={styles.progressItemTitle}>{title}</Text>
        <Text style={styles.progressItemSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <ProgressRing 
      progress={progress} 
      size={60} 
      strokeWidth={6}
    />
  </Animated.View>
);

export default function HomeScreen() {
  const [greeting, setGreeting] = useState('');
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [prepProgress, setPrepProgress] = useState({ completed: 0, total: 12, percent: 0 });
  const [learningProgress, setLearningProgress] = useState({ completed: 0, total: 8, percent: 0 });
  const [gameStats, setGameStats] = useState({ bestScore: 0, totalGames: 0, victories: 0 });
  const [badgesCount, setBadgesCount] = useState(0);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lastTriggerHashRef = React.useRef<string | null>(null);

  // Greeting logic with emoji
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning 🌅');
    else if (hour < 17) setGreeting('Good Afternoon ☀️');
    else setGreeting('Good Evening 🌙');
  }, []);

  const GOOGLE_API_KEY = 'AIzaSyArdmspgrOxH-5S5ABU72Xv-7UCh5HmxyI';
  const OPENWEATHERMAP_API_KEY = '74b1abc58a408ca6b11c27b8292797cb';

  // Fetch weather data based on location
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingWeather(true);

      let locationName = '';
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results.length > 0) {
          const address = geoData.results[0].address_components;
          const cityObj = address.find((c: any) => c.types.includes('locality'));
          const regionObj = address.find((c: any) => c.types.includes('administrative_area_level_1'));
          locationName = cityObj?.long_name || regionObj?.long_name || '';
        }
      } catch (e) {
        locationName = '';
      }

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
      );
      const weatherData = await weatherRes.json();

      setWeather({
        temperature: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        location: locationName,
        icon: weatherData.weather[0].icon,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
      });
      setIsLoadingWeather(false);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setLocationError('Unable to fetch weather data');
      setIsLoadingWeather(false);
    }
  }, []);

  // --- Notification pipeline: fetch forecast, derive alerts, and push local notifications
  // Fetch 3-hour forecast and raise alerts if thresholds exceeded
  const fetchForecastAndAlert = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`
      );
      const data = await res.json();

  const triggers = evaluateForecast(data, defaultThresholds);
  const now = Date.now();
  // Capture current time once so we can ignore any forecast buckets that already happened
      const nowIso = new Date(now).toISOString();

      // Group triggers by time block (collapse multiple conditions into one alert per time)
      const severityRank = (s: 'low'|'medium'|'high') => (s === 'high' ? 3 : s === 'medium' ? 2 : 1);
      const bucketKeyFrom = (at: string) => {
        const d = new Date(at);
        if (isNaN(d.getTime())) return at;

        // Normalize to the nearest 3-hour block (UTC)
        const hours = d.getUTCHours();
        const rounded = Math.floor(hours / 3) * 3;
        d.setUTCHours(rounded, 0, 0, 0);

        return d.toISOString();
      };

      type Group = { at: string; byType: Map<string, { t: any; severity: 'low'|'medium'|'high' }> };
      const groups = new Map<string, Group>();
      for (const t of triggers) {
        const sev = computeSeverity(t.type, t.value, t.threshold);
        const key = bucketKeyFrom(t.at);
        const bucketTime = new Date(key).getTime();

        if (__DEV__) {
          console.log('[alerts]', 'bucket', key, 'vs now', nowIso);
        }

        if (!Number.isNaN(bucketTime) && bucketTime <= now) {
          // Skip past forecast buckets so reloads don't resurface stale alerts
          continue;
        }
        const g = groups.get(key) ?? { at: key, byType: new Map() };
        const existing = g.byType.get(t.type);
        if (!existing || severityRank(sev) > severityRank(existing.severity)) {
          g.byType.set(t.type, { t, severity: sev });
        }
        groups.set(key, g);
      }

      // Build one alert per time bucket, aggregating messages and choosing max severity
      const aggregated = Array.from(groups.values())
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
        .map(g => {
          const entries = Array.from(g.byType.values());
          let maxSev: 'low'|'medium'|'high' = 'low';
          for (const it of entries) if (severityRank(it.severity) > severityRank(maxSev)) maxSev = it.severity;

          const atDate = new Date(g.at);
          const atLabel = isNaN(atDate.getTime())
            ? g.at
            : atDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const lines = entries.map(({ t }) => {
            if (t.type === 'rain') return `Heavy rain ~ ${t.value}mm/3h (≥ ${t.threshold}mm)`;
            if (t.type === 'wind') return `High wind ${t.value} m/s (≥ ${t.threshold} m/s)`;
            if (t.type === 'temp-high') return `High temp ${t.value}°C (≥ ${t.threshold}°C)`;
            return `Low temp ${t.value}°C (≤ ${t.threshold}°C)`;
          });

          // Choose icon: multi-hazard -> warning, else type-specific
          let icon = '⚠️';
          if (entries.length === 1) {
            const t = entries[0].t;
            icon = t.type === 'rain' ? '🌧️' : t.type === 'wind' ? '💨' : t.type === 'temp-high' ? '🔥' : '❄️';
          }

          const title = entries.length > 1 ? 'Weather Alert' : (
            entries[0].t.type === 'rain' ? 'Heavy Rain Forecast' :
            entries[0].t.type === 'wind' ? 'High Wind Forecast' :
            entries[0].t.type === 'temp-high' ? 'High Temperature Forecast' :
            'Low Temperature Forecast'
          );

          return {
            id: `grp-${g.at}`,
            type: 'group',
            title,
            description: lines.join(' • '),
            severity: maxSev,
            timestamp: atLabel,
            icon,
          };
        });

      // Update UI alerts (limit to top 5)
      const mapped = aggregated.slice(0, 5);
      setAlerts(mapped);

      if (!aggregated.length) {
        lastTriggerHashRef.current = null;
        return;
      }

      const granted = await ensurePermissionsAsync();
      if (!granted) return;
      await ensureAndroidChannelAsync();

      // Use first 1–2 grouped alerts for notification summary
      const notifBody = mapped.length > 0
        ? mapped.slice(0, 2).map(a => a.description).join(' • ')
        : 'Upcoming weather conditions exceed your thresholds.';

      // Build hash from aggregated buckets and their types/values
      const hash = JSON.stringify(
        Array.from(groups.values()).map(g => {
          const parts = Array.from(g.byType.values()).map(({ t }) => `${t.type}:${t.value}`);
          return `${g.at}|${parts.sort().join(',')}`;
        }).sort()
      );
      if (hash !== lastTriggerHashRef.current) {
        await sendLocalNotification('Weather alert', notifBody);
        lastTriggerHashRef.current = hash;
      }
    } catch (e) {
      console.warn('Forecast check failed:', e);
    }
  }, []);

  // Get user's location and fetch weather
  const getLocationAndWeather = useCallback(async () => {
    try {
      setIsLoadingWeather(true);
      setLocationError(null);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setIsLoadingWeather(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      await fetchWeatherData(latitude, longitude);
      // Also check forecast thresholds and notify locally if needed
      fetchForecastAndAlert(latitude, longitude);

    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      setIsLoadingWeather(false);
    }
  }, [fetchWeatherData, fetchForecastAndAlert]);

  // Enhanced progress calculation with real-time data
  const refreshProgress = useCallback(async () => {
    try {
      setRefreshing(true);

    // Import all checklist sources and storage
    const { getUserProgress } = await import('@/utils/storage');
    const { checklistItems } = await import('@/utils/checklistData');
    const { getCustomItems } = await import('@/utils/storage');

      // Get all checklist items (predefined, custom)
      const predefinedItems = checklistItems || [];
      const customItems = await getCustomItems();

      // Get completed items from user progress
      const userProgress = await getUserProgress();
      const completedIds = Array.isArray(userProgress.completedItems)
        ? userProgress.completedItems
        : [];

      // Fallback: get AI toolkit items using getPersonalizedToolkit (returns array of names)
      let aiItems: { id: string; name: string }[] = [];
      try {
        // Use points and level as a simple profile for AI toolkit
        const profile = {
          points: userProgress.points || 0,
          level: userProgress.level || 1
        };
        const aiToolkitNames = await getPersonalizedToolkit(profile);
        aiItems = Array.isArray(aiToolkitNames)
          ? aiToolkitNames.map((name, idx) => ({ id: `ai-${idx}`, name }))
          : [];
      } catch (err) {
        aiItems = [];
      }

      const allItems = [
        ...predefinedItems,
        ...(Array.isArray(customItems) ? customItems : []),
        ...(Array.isArray(aiItems) ? aiItems : [])
      ];

      // Calculate accurate progress
      const totalItems = allItems.length;
      const completedItems = allItems.filter(item => completedIds.includes(item.id)).length;
      const prepPercent = totalItems > 0 ? Math.min(100, (completedItems / totalItems) * 100) : 0;

      setPrepProgress({
        completed: completedItems,
        total: totalItems,
        percent: prepPercent
      });

      // Calculate learning progress (unchanged)
      const completedContent = userProgress.completedLearning || [];
      const eduProgress = getEducationalProgress(completedContent);
      setLearningProgress({
        completed: eduProgress.completed,
        total: eduProgress.total,
        percent: eduProgress.percentage
      });

      // Get game stats (unchanged)
      const stats = await GameStorage.getStats();
      setGameStats({
        bestScore: stats.bestScore,
        totalGames: stats.totalGames,
        victories: stats.victories
      });

      // Calculate badges (unchanged)
      const earned = getEarnedBadges({
        completedItems: completedIds,
        totalPoints: userProgress.points || 0
      });
      setBadgesCount(earned.length);

      // Get AI tip (unchanged)
      const aiRecommendation = await getAiRecommendation();
      setAiTip(aiRecommendation);

    } catch (error) {
      console.error('Error refreshing progress:', error);
      // Set default values
      setPrepProgress({ completed: 0, total: 0, percent: 0 });
      setLearningProgress({ completed: 0, total: 0, percent: 0 });
      setGameStats({ bestScore: 0, totalGames: 0, victories: 0 });
      setBadgesCount(0);
      setAiTip(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProgress();
    }, [refreshProgress])
  );

  useEffect(() => {
    const loadPersistedData = async () => {
      const customItems = await getCustomItems();
      setCustomItems(customItems);
    };

    loadPersistedData();
    refreshProgress();
    getLocationAndWeather();
  }, []);

  // Periodically re-check forecast so alerts disappear when conditions normalize
  useEffect(() => {
    if (!userLocation) return;
    const id = setInterval(() => {
      fetchForecastAndAlert(userLocation.latitude, userLocation.longitude);
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(id);
  }, [userLocation, fetchForecastAndAlert]);

  const onRefresh = useCallback(() => {
    refreshProgress();
    getLocationAndWeather();
  }, [refreshProgress, getLocationAndWeather]);

  const navigateToScreen = (screen: 'safe-zone' | 'toolkit' | 'community' | 'mock-alerts') => {
    const routeMap: Record<typeof screen, string> = {
      'safe-zone': '/safe-zone',
      'toolkit': '/toolkit',
      'community': '/community',
      'mock-alerts': '/mock-alerts',
    };
    router.push(routeMap[screen] as any);
  };

  // DEV: inject sample alerts to test severity color mapping (yellow/orange/red)
  const injectSeverityTestAlerts = useCallback(() => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts([
      {
        id: 'rain-low',
        type: 'rain',
        title: 'Light Rain Forecast',
        description: 'Rain ~ 6mm in 3h (threshold 5mm)',
        severity: 'low',
        timestamp: now,
        icon: '🌧️',
      },
      {
        id: 'wind-medium',
        type: 'wind',
        title: 'Wind Picking Up',
        description: 'Winds up to 17 m/s (threshold 12 m/s)',
        severity: 'medium',
        timestamp: 'in 3h',
        icon: '💨',
      },
      {
        id: 'temp-high',
        type: 'temp-high',
        title: 'High Temperature Forecast',
        description: 'Up to 45°C (threshold 35°C)',
        severity: 'high',
        timestamp: 'in 6h',
        icon: '🔥',
      },
    ] as any[]);
  }, []);

  const clearAlertsManually = useCallback(() => setAlerts([]), []);

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return 'weather-sunny';
      case 'clouds':
        return 'weather-cloudy';
      case 'rain':
        return 'weather-rainy';
      case 'snow':
        return 'weather-snowy';
      case 'thunderstorm':
        return 'weather-lightning';
      case 'drizzle':
        return 'weather-pouring';
      case 'mist':
      case 'fog':
      case 'haze':
        return 'weather-fog';
      default:
        return 'weather-partly-cloudy';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return RED_GRADIENT;      // Red for highest severity
      case 'medium': return ORANGE_GRADIENT; // Orange for medium
      case 'low': return YELLOW_GRADIENT;    // Yellow for low
      default: return PRIMARY_GRADIENT;
    }
  };

  const computeSeverity = (type: string, value: number, threshold: number): 'low' | 'medium' | 'high' => {
    let diff = 0;
    if (type === 'temp-low') {
      diff = threshold - value;
    } else {
      diff = value - threshold;
    }
    if (diff >= 10) return 'high';
    if (diff >= 5) return 'medium';
    return 'low';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View 
          entering={ZoomIn.duration(1000)}
          style={[styles.bgCircle, styles.bgCircle1]} 
        />
        <Animated.View 
          entering={ZoomIn.duration(1200).delay(200)}
          style={[styles.bgCircle, styles.bgCircle2]} 
        />
        <Animated.View 
          entering={ZoomIn.duration(1400).delay(400)}
          style={[styles.bgCircle, styles.bgCircle3]} 
        />
      </View>

      <Animated.View 
        style={styles.content}
        entering={SlideInDown.duration(800)}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Animated.Text 
                entering={FadeInUp.duration(600)}
                style={styles.greeting}
              >
                {greeting}
              </Animated.Text>
              <Animated.Text 
                entering={FadeInUp.duration(600).delay(200)}
                style={styles.subtitle}
              >
                Stay prepared, stay safe
              </Animated.Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications" size={24} color="#1f2937" />
                {alerts.length > 0 && (
                  <Badge count={alerts.length} style={styles.notificationBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Card */}
          <Animated.View entering={FadeInUp.duration(600).delay(300)}>
            <Card gradient={PRIMARY_GRADIENT} style={styles.weatherCard}>
              {isLoadingWeather ? (
                <View style={styles.weatherLoading}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.weatherLoadingText}>Getting weather data...</Text>
                </View>
              ) : locationError ? (
                <View style={styles.weatherContent}>
                  <MaterialCommunityIcons name="weather-cloudy-alert" size={32} color="#fff" />
                  <View style={styles.weatherText}>
                    <Text style={styles.weatherTitle}>Weather Unavailable</Text>
                    <Text style={styles.weatherDescription}>{locationError}</Text>
                  </View>
                </View>
              ) : weather ? (
                <View style={styles.weatherContent}>
                  <MaterialCommunityIcons 
                    name={getWeatherIcon(weather.condition)} 
                    size={36} 
                    color="#fff" 
                  />
                  <View style={styles.weatherText}>
                    <Text style={styles.weatherTitle}>
                      {weather.temperature}°C • {weather.condition}
                    </Text>
                    <Text style={styles.weatherDescription}>
                      {weather.location} • {weather.description}
                    </Text>
                    <View style={styles.weatherDetails}>
                      <Text style={styles.weatherDetail}>💧 {weather.humidity}%</Text>
                      <Text style={styles.weatherDetail}>💨 {weather.windSpeed} m/s</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {__DEV__ && (
            <Card style={styles.devCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.devTitle}>Dev: Test alert colors</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={injectSeverityTestAlerts} style={styles.devBtn}>
                    <Text style={styles.devBtnText}>Show test alerts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearAlertsManually} style={[styles.devBtn, { backgroundColor: '#ef4444' }]}>
                    <Text style={styles.devBtnText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Animated.View entering={LightSpeedInLeft.duration(500)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Alerts</Text>
                <Badge count={alerts.length} />
              </View>
              <View style={styles.alertsContainer}>
                {alerts.map((alert, index) => (
                  <Animated.View
                    key={alert.id}
                    entering={FlipInYLeft.delay(index * 150).duration(600)}
                  >
                    <Card style={styles.alertCard}>
                      <LinearGradient
                        colors={getSeverityColor(alert.severity) as [ColorValue, ColorValue, ...ColorValue[]]}
                        style={styles.alertGradient}
                      >
                        <View style={styles.alertIcon}>
                          <Text style={styles.alertEmoji}>{alert.icon}</Text>
                        </View>
                        <View style={styles.alertContent}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={styles.alertDescription}>{alert.description}</Text>
                          <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                        </View>
                        <View style={styles.alertSeverity}>
                          <View style={[
                            styles.severityDot,
                            { backgroundColor: alert.severity === 'high' ? '#fff' : '#fff' }
                          ]} />
                        </View>
                      </LinearGradient>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickActions}
              contentContainerStyle={styles.quickActionsScroll}
            >
              {quickActions.map((action, index) => (
                <Animated.View
                  key={action.title}
                  entering={ZoomIn.delay(300 + index * 100).duration(500)}
                  style={styles.quickActionContainer}
                >
                  <TouchableOpacity
                    onPress={() => navigateToScreen(action.screen)}
                    style={styles.quickActionTouchable}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={action.gradient as [ColorValue, ColorValue, ...ColorValue[]]}
                      style={styles.quickActionCard}
                    >
                      <View style={styles.quickActionIcon}>
                        {action.icon}
                      </View>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                      <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Progress Section */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <TouchableOpacity onPress={refreshProgress}>
                <Ionicons name="refresh" size={20} color={PRIMARY} />
              </TouchableOpacity>
            </View>
            <Card style={styles.progressCard}>
              <View style={styles.progressContent}>
                <ProgressItem
                  title="Preparedness"
                  subtitle={`${prepProgress.completed}/${prepProgress.total} tasks`}
                  progress={prepProgress.percent}
                  icon={<Feather name="check-circle" size={20} color={PRIMARY} />}
                  color={PRIMARY}
                />
                <ProgressItem
                  title="Learning"
                  subtitle={`${learningProgress.completed}/${learningProgress.total} modules`}
                  progress={learningProgress.percent}
                  icon={<Ionicons name="book" size={20} color={YELLOW} />}
                  color={YELLOW}
                />
                <ProgressItem
                  title="Training Game"
                  subtitle={`${gameStats.victories} wins • ${gameStats.totalGames} games`}
                  progress={gameStats.totalGames > 0 ? (gameStats.victories / gameStats.totalGames) * 100 : 0}
                  icon={<Ionicons name="game-controller" size={20} color={ORANGE} />}
                  color={ORANGE}
                />
                <ProgressItem
                  title="Badges"
                  subtitle={`${badgesCount} earned`}
                  progress={badgesCount > 0 ? (badgesCount / 10) * 100 : 0} // Assuming 10 total badges
                  icon={<Ionicons name="trophy" size={20} color="#8B5CF6" />}
                  color="#8B5CF6"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)}>
            <Card style={styles.heroCard}>
              <LinearGradient colors={PRIMARY_GRADIENT as [ColorValue, ColorValue, ...ColorValue[]]} style={styles.heroGradient}>
                <View style={styles.heroContent}>
                  <View style={styles.heroIcon}>
                    <Feather name="shield" size={32} color="#fff" />
                  </View>
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Stay Prepared, Stay Safe</Text>
                    <Text style={styles.heroSubtitle}>
                      Your comprehensive emergency preparedness companion
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Card>
          </Animated.View>
        </ScrollView>
      </Animated.View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: ORANGE,
  },
  weatherCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  weatherLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherLoadingText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherText: {
    flex: 1,
    marginLeft: 16,
  },
  weatherTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  weatherDescription: {
    color: '#e0ffe0',
    fontSize: 14,
    marginBottom: 6,
  },
  weatherDetails: {
    flexDirection: 'row',
  },
  weatherDetail: {
    color: '#e0ffe0',
    fontSize: 12,
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  alertsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  alertCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertEmoji: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  alertDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginBottom: 4,
  },
  alertTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  alertSeverity: {
    marginLeft: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsScroll: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  quickActionContainer: {
    width: Math.min(width * 0.30, 220),
    marginRight: 16,
  },
  quickActionTouchable: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  progressContent: {
    padding: 20,
    gap: 16,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  progressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressText: {
    flex: 1,
  },
  progressItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  progressItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingBackground: {
    position: 'absolute',
    borderColor: '#e5e7eb',
  },
  progressRingFill: {
    position: 'absolute',
    borderColor: 'transparent',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressRingContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
  },
  progressRingLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  progressRingValue: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 1,
  },
  aiTipCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  aiTipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  aiTipIcon: {
    marginRight: 12,
  },
  aiTipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  // Dev tester styles
  devCard: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff7ed', // light orange background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
  },
  devBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  devBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
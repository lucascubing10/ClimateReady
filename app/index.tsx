import React, { useEffect, useState, useCallback, JSX } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StyleSheet
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
  ZoomIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { getUserProfile } from '@/utils/userProfile';
import { getPersonalizedToolkit } from '@/utils/gemini';
import { getEducationalProgress } from '@/utils/educationalData';
import { GameStorage } from '@/utils/gameStorage';
import { getEarnedBadges } from '@/utils/badges';

const { width } = Dimensions.get('window');

// Color palette
const PRIMARY = '#5ba24f';
const PRIMARY_GRADIENT = ['#5ba24f', '#4a8c40'];
const YELLOW = '#fac609';
const YELLOW_GRADIENT = ['#fac609', '#e6b408'];
const ORANGE = '#e5793a';
const ORANGE_GRADIENT = ['#e5793a', '#d4692a'];
const BG = '#dcefdd';
const CARD_BG = '#ffffff';

const quickActions: {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  bgColor: string;
  gradient: string[];
  screen: 'safe-zone' | 'toolkit' | 'community';
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
    subtitle: 'Connect & share',
    icon: <Ionicons name="people" size={24} color="#fff" />,
    bgColor: ORANGE,
    gradient: ORANGE_GRADIENT,
    screen: 'community',
  },
];

const mockAlerts = [
  {
    id: '1',
    type: 'warning',
    title: 'Heat Wave Warning',
    description: 'Excessive heat expected. Temperatures may reach 40°C.',
    severity: 'high',
    timestamp: '2 hours ago',
    icon: '🔥',
  },
  {
    id: '2',
    type: 'watch',
    title: 'Air Quality Advisory',
    description: 'Unhealthy air quality due to wildfire smoke.',
    severity: 'medium',
    timestamp: '5 hours ago',
    icon: '💨',
  },
];

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
    <View style={[styles.card, style]}>
      {children}
    </View>
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

// Badge Component
const Badge = ({ count, style }: any) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.badgeText}>{count}</Text>
  </View>
);

// Progress Component
const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressRingContainer, { width: size, height: size }]}>
      <View style={styles.progressRingBackground} />
      <Animated.View
        style={[
          styles.progressRingFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: PRIMARY,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      <View style={styles.progressRingText}>
        <Text style={styles.progressRingPercent}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [greeting, setGreeting] = useState('');
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [prepProgress, setPrepProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [learningProgress, setLearningProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const [gameStats, setGameStats] = useState({ bestScore: 0, totalGames: 0, victories: 0 });
  const [badgesCount, setBadgesCount] = useState(0);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Greeting logic
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    setAlerts(mockAlerts);
  }, []);

  const GOOGLE_API_KEY = 'AIzaSyArdmspgrOxH-5S5ABU72Xv-7UCh5HmxyI'; // Replace with your Google API key
  const OPENWEATHERMAP_API_KEY = '74b1abc58a408ca6b11c27b8292797cb'; // Replace with your OpenWeatherMap API key

  // Fetch weather data based on location
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingWeather(true);

      // 1. Get city/region name from Google Geocoding API
      let locationName = '';
      try {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results.length > 0) {
          const address = geoData.results[0].address_components;
          const cityObj = address.find((c: any) =>
            c.types.includes('locality')
          );
          const regionObj = address.find((c: any) =>
            c.types.includes('administrative_area_level_1')
          );
          const countryObj = address.find((c: any) =>
            c.types.includes('country')
          );
          locationName = cityObj?.long_name || regionObj?.long_name || countryObj?.long_name || '';
        }
      } catch (e) {
        locationName = '';
      }

      // 2. Fetch weather from OpenWeatherMap API
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

  // Get user's location and fetch weather
  const getLocationAndWeather = useCallback(async () => {
    try {
      setIsLoadingWeather(true);
      setLocationError(null);

      // Request permission and get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setIsLoadingWeather(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Use real coordinates for weather
      await fetchWeatherData(location.coords.latitude, location.coords.longitude);

    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      setIsLoadingWeather(false);
    }
  }, [fetchWeatherData]);

  // Fetch progress and badges
  const refreshProgress = useCallback(async () => {
    // Mock progress data
    setProgress({
      points: 450,
      percent: 65,
      completedItems: 26,
      totalItems: 40
    });
    setBadges(['first_aid', 'water_supply', 'emergency_kit']);
  }, []);

  // Fetch all progress data on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        // 1. Preparedness Progress (from toolkit)
        // Replace with your actual storage/context logic
        const toolkit = await import('@/utils/storage');
        const userProgress = await toolkit.getUserProgress();
        setPrepProgress({
          completed: Array.isArray(userProgress.completedItems) ? userProgress.completedItems.length : 0,
          total: userProgress.totalItems ?? 0,
          percent: userProgress.percent ?? 0
        });

        // 2. Learning Progress
        const completedContent = userProgress.completedLearning || [];
        const eduProgress = getEducationalProgress(completedContent);
        setLearningProgress({
          completed: eduProgress.completed,
          total: eduProgress.total,
          percent: eduProgress.percentage
        });

        // 3. Game Stats
        const stats = await GameStorage.getStats();
        setGameStats({
          bestScore: stats.bestScore,
          totalGames: stats.totalGames,
          victories: stats.victories
        });

        // 4. Badges
        const earned = getEarnedBadges({
          completedItems: userProgress.completedItems,
          totalPoints: userProgress.points
        });
        setBadgesCount(earned.length);

        // 5. Gemini AI Tip (optional)
        try {
          const profile = await getUserProfile();
          const kit = await getPersonalizedToolkit(userProgress);
          setAiTip(`AI recommends: ${kit.slice(0, 2).join(', ')}...`);
        } catch {
          setAiTip(null);
        }
      })();
    }, [])
  );

  // Only get weather/location on mount
  useEffect(() => {
    getLocationAndWeather();
    refreshProgress();
  }, [getLocationAndWeather, refreshProgress]);

  // Only refresh progress when navigating back to home
  useFocusEffect(
    useCallback(() => {
      refreshProgress();
    }, [refreshProgress])
  );

  const navigateToScreen = (screen: 'safe-zone' | 'toolkit' | 'community') => {
    const routeMap: Record<typeof screen, string> = {
      'safe-zone': '/safe-zone',
      'toolkit': '/toolkit',
      'community': '/community',
    };
    router.push(routeMap[screen] as any);
  };

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
      case 'high': return ORANGE_GRADIENT;
      case 'medium': return YELLOW_GRADIENT;
      default: return PRIMARY_GRADIENT;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
      </View>

      <Animated.View 
        style={styles.content}
        entering={SlideInDown.duration(800)}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.subtitle}>Stay prepared, stay safe</Text>
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
          <Animated.View entering={FadeInUp.duration(600)}>
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
        >
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Animated.View entering={FadeInUp.duration(500)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Alerts</Text>
                <Badge count={alerts.length} />
              </View>
              <View style={styles.alertsContainer}>
                {alerts.map((alert, index) => (
                  <Animated.View
                    key={alert.id}
                    entering={FadeInRight.delay(index * 100).duration(500)}
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
                            { backgroundColor: alert.severity === 'high' ? '#fff' : alert.severity === 'medium' ? '#fff' : '#fff' }
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
          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <Animated.View
                  key={action.title}
                  entering={ZoomIn.delay(200 + index * 100).duration(500)}
                  style={styles.quickActionContainer}
                >
                  <TouchableOpacity
                    onPress={() => navigateToScreen(action.screen)}
                    style={styles.quickActionTouchable}
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
            </View>
          </Animated.View>

          {/* Progress Section */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
            </View>
            <Card style={styles.progressCard}>
              <LinearGradient colors={['#fff', '#f8fafc']} style={styles.progressContent}>
                {/* Preparedness */}
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Preparedness</Text>
                    <Text style={styles.progressSubtitle}>
                      {prepProgress.completed} of {prepProgress.total} tasks completed
                    </Text>
                  </View>
                  <ProgressRing progress={prepProgress.percent} />
                </View>
                {/* Learning */}
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Learning</Text>
                    <Text style={styles.progressSubtitle}>
                      {learningProgress.completed} of {learningProgress.total} modules
                    </Text>
                  </View>
                  <ProgressRing progress={learningProgress.percent} />
                </View>
                {/* Game */}
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Training Game</Text>
                    <Text style={styles.progressSubtitle}>
                      Best Score: {gameStats.bestScore} | Games: {gameStats.totalGames} | Wins: {gameStats.victories}
                    </Text>
                  </View>
                  <Ionicons name="game-controller" size={32} color={PRIMARY} />
                </View>
                {/* Badges */}
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Badges</Text>
                    <Text style={styles.progressSubtitle}>
                      {badgesCount} earned
                    </Text>
                  </View>
                  <Ionicons name="trophy" size={32} color={ORANGE} />
                </View>
                {/* AI Tip */}
                {aiTip && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: PRIMARY, fontWeight: '600' }}>{aiTip}</Text>
                  </View>
                )}
              </LinearGradient>
            </Card>
          </Animated.View>

          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alertsContainer: {
    gap: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionContainer: {
    flex: 1,
    marginHorizontal: 6,
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
  },
  progressContent: {
    padding: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
  },
  progressRingFill: {
    position: 'absolute',
  },
  progressRingText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  progressStats: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
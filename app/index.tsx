import React, { useEffect, useState, useCallback, JSX } from 'react';
import { View, Text, ScrollView, TouchableOpacity, AppState, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Card } from '../components/Toolkit/Card';
import { Badge } from '../components/Toolkit/Badge';
import { ProgressBar } from '../components/Toolkit/ProgressBar';
import { getUserProgress } from '../utils/storage';
import { getEarnedBadges } from '../utils/badges';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const PRIMARY = '#5ba24f';
const YELLOW = '#fac609';
const ORANGE = '#e5793a';
const BG = '#dcefdd';

// Replace with your OpenWeatherMap API key
const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey; // Get from https://openweathermap.org/api

const quickActions: {
  title: string;
  subtitle: string;
  icon: JSX.Element;
  bgColor: string;
  screen: 'safe-zone' | 'toolkit' | 'community';
}[] = [
  {
    title: 'Safe Zones',
    subtitle: 'Find nearby shelters',
    icon: <Ionicons name="map" size={24} color="#fff" />,
    bgColor: '#5ba24f',
    screen: 'safe-zone',
  },
  {
    title: 'Toolkit',
    subtitle: 'Emergency checklists',
    icon: <Feather name="package" size={24} color="#fff" />,
    bgColor: '#fac609',
    screen: 'toolkit',
  },
  {
    title: 'Community',
    subtitle: 'Connect & share',
    icon: <Ionicons name="people" size={24} color="#fff" />,
    bgColor: '#e5793a',
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
  },
  {
    id: '2',
    type: 'watch',
    title: 'Air Quality Advisory',
    description: 'Unhealthy air quality due to wildfire smoke.',
    severity: 'medium',
    timestamp: '5 hours ago',
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

export default function HomeScreen() {
  const [greeting, setGreeting] = useState('');
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
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

  // Fetch weather data based on location
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsLoadingWeather(true);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }
      
      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        location: data.name,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setLocationError('Unable to fetch weather data');
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Get user's location and fetch weather
  const getLocationAndWeather = useCallback(async () => {
    try {
      setIsLoadingWeather(true);
      setLocationError(null);
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setIsLoadingWeather(false);
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;
      
      // Fetch weather data
      await fetchWeatherData(latitude, longitude);
      
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      setIsLoadingWeather(false);
    }
  }, [fetchWeatherData]);

  // Fetch progress and badges
  const refreshProgress = useCallback(async () => {
    const userProgress = await getUserProgress();
    setProgress(userProgress);
    setBadges(getEarnedBadges(userProgress));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProgress();
      getLocationAndWeather();
    }, [refreshProgress, getLocationAndWeather])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshProgress();
        getLocationAndWeather();
      }
    });
    return () => sub.remove();
  }, [refreshProgress, getLocationAndWeather]);

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

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: PRIMARY }}>{greeting}</Text>
            <Text style={{ color: '#666', fontSize: 14 }}>Your ClimateReady App</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ marginRight: 12 }}>
              <Ionicons name="notifications" size={24} color={alerts.length ? ORANGE : '#888'} />
              {alerts.length > 0 && (
                <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: ORANGE, borderRadius: 4 }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Weather Card */}
        <Card style={{ marginTop: 16, backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          {isLoadingWeather ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <ActivityIndicator color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 12 }}>Getting weather...</Text>
            </View>
          ) : locationError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialCommunityIcons name="weather-cloudy-alert" size={32} color="#fff" />
              <View style={{ marginLeft: 16 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Weather Unavailable</Text>
                <Text style={{ color: '#e0ffe0', fontSize: 13 }}>{locationError}</Text>
              </View>
            </View>
          ) : weather ? (
            <>
              <MaterialCommunityIcons 
                name={getWeatherIcon(weather.condition)} 
                size={32} 
                color="#fff" 
              />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {weather.temperature}°C - {weather.condition}
                </Text>
                <Text style={{ color: '#e0ffe0', fontSize: 13 }}>
                  {weather.location} • {weather.description}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <Text style={{ color: '#e0ffe0', fontSize: 12, marginRight: 12 }}>
                    💧 {weather.humidity}%
                  </Text>
                  <Text style={{ color: '#e0ffe0', fontSize: 12 }}>
                    💨 {weather.windSpeed} m/s
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </Card>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Alerts */}
        {alerts.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 8 }}>Active Alerts</Text>
            {alerts.map((alert) => (
              <Card key={alert.id} style={{
                borderLeftWidth: 4,
                borderLeftColor: alert.severity === 'high' ? ORANGE : alert.severity === 'medium' ? YELLOW : PRIMARY,
                marginBottom: 8,
                backgroundColor: '#fff'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                  <Feather name={alert.type === 'warning' ? 'alert-triangle' : 'cloud'} size={20} color={alert.severity === 'high' ? ORANGE : alert.severity === 'medium' ? YELLOW : PRIMARY} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>{alert.title}</Text>
                    <Text style={{ color: '#666', fontSize: 13 }}>{alert.description}</Text>
                    <Text style={{ color: '#aaa', fontSize: 12 }}>{alert.timestamp}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333', marginVertical: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={{ flex: 1, marginHorizontal: 4 }}
                onPress={() => navigateToScreen(action.screen)}
              >
                <Card style={{ alignItems: 'center', padding: 16, backgroundColor: action.bgColor }}>
                  {action.icon}
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 8 }}>{action.title}</Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>{action.subtitle}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Progress & Badges */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333', marginVertical: 12 }}>Your Progress</Text>
          <Card style={{ backgroundColor: '#fff', padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ backgroundColor: PRIMARY, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="award" size={22} color="#fff" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: PRIMARY }}>Level {progress?.level || 1}</Text>
                <Text style={{ color: '#666', fontSize: 13 }}>{progress?.points || 0} points</Text>
              </View>
            </View>
            <ProgressBar progress={progress?.percent || 0} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              {badges.map((badge, i) => (
                <Badge key={i} icon={badge.icon} label={badge.label} />
              ))}
              <Text style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{badges.length} badges earned</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Hero Image */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Card style={{ marginTop: 20, overflow: 'hidden', borderRadius: 16, padding: 0 }}>
            <View style={{ width: '100%', height: 120, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="shield" size={32} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>Stay Prepared, Stay Safe</Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
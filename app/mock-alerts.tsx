import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { useRouter } from 'expo-router';
import { ensurePermissionsAsync, ensureAndroidChannelAsync, sendLocalNotification } from '@/utils/notifications';

const SEVERITY_GRADIENTS: Record<'low' | 'medium' | 'high', [ColorValue, ColorValue]> = {
  low: ['#34d399', '#059669'],
  medium: ['#fb923c', '#f97316'],
  high: ['#ef4444', '#dc2626'],
};

const SEVERITY_LABELS: { value: SeverityLevel; title: string; subtitle: string }[] = [
  { value: 'low', title: 'Low', subtitle: 'Advisory' },
  { value: 'medium', title: 'Medium', subtitle: 'Watch' },
  { value: 'high', title: 'High', subtitle: 'Warning' },
];

type SeverityLevel = 'low' | 'medium' | 'high';

type HazardKey = 'rain' | 'wind' | 'temp-high' | 'temp-low';

type HazardConfig = {
  key: HazardKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: [ColorValue, ColorValue];
  samples: Record<SeverityLevel, { headline: string; details: string }>; 
};

// Mock alert presets let users dry-run different hazard notifications
const HAZARDS: HazardConfig[] = [
  {
    key: 'rain',
    title: 'Heavy Rainfall',
    description: 'Simulate flash flood or torrential rain alerts to test your readiness.',
    icon: <Ionicons name="rainy" size={28} color="#fff" />, 
    gradient: ['#38bdf8', '#1d4ed8'],
    samples: {
      low: { headline: 'Light showers expected', details: 'Rainfall of 5mm within 3 hours. Keep an umbrella handy.' },
      medium: { headline: 'Moderate rain inbound', details: 'Persistent rainfall may lead to slick roads. Review your flood plan.' },
      high: { headline: 'Severe rain alert', details: 'Over 35mm rainfall in 3 hours. Move to higher ground immediately.' },
    },
  },
  {
    key: 'wind',
    title: 'Strong Winds',
    description: 'Test alerts for high wind scenarios, from breezy conditions to destructive gusts.',
    icon: <Feather name="wind" size={28} color="#fff" />, 
    gradient: ['#a855f7', '#7c3aed'],
    samples: {
      low: { headline: 'Breezy conditions', details: 'Wind speeds near 20 km/h. Secure light outdoor items.' },
      medium: { headline: 'High wind watch', details: 'Gusts up to 60 km/h expected. Avoid open areas.' },
      high: { headline: 'Damaging wind warning', details: 'Gusts exceeding 90 km/h. Stay indoors and avoid travel.' },
    },
  },
  {
    key: 'temp-high',
    title: 'Extreme Heat',
    description: 'Check your response to heatwaves and heat advisory notifications.',
    icon: <Ionicons name="sunny" size={28} color="#fff" />, 
    gradient: ['#f97316', '#ea580c'],
    samples: {
      low: { headline: 'Warm conditions', details: 'Temperatures rising to 30°C. Stay hydrated.' },
      medium: { headline: 'Heat advisory', details: 'Temps of 37°C expected. Limit outdoor activity.' },
      high: { headline: 'Heat emergency', details: 'Temps beyond 42°C. Seek cooled shelter immediately.' },
    },
  },
  {
    key: 'temp-low',
    title: 'Extreme Cold',
    description: 'Run cold-weather mock alerts, from chilly breezes to freezing storms.',
    icon: <Ionicons name="snow" size={28} color="#fff" />, 
    gradient: ['#38bdf8', '#0ea5e9'],
    samples: {
      low: { headline: 'Chilly evening', details: 'Temperatures near 5°C. Dress in layers.' },
      medium: { headline: 'Frost advisory', details: 'Below freezing expected overnight. Protect fragile plants.' },
      high: { headline: 'Extreme cold warning', details: '−15°C wind chills. Limit time outdoors and check heating.' },
    },
  },
];

// Dedicated screen for crafting and pushing mock weather alerts
export default function MockAlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [lastTriggered, setLastTriggered] = useState<{ hazard: HazardKey; severity: SeverityLevel } | null>(null);

  const lastPreview = useMemo(() => {
    if (!lastTriggered) return null;
    const hazard = HAZARDS.find((item) => item.key === lastTriggered.hazard);
    if (!hazard) return null;
    return {
      headline: hazard.samples[lastTriggered.severity].headline,
      details: hazard.samples[lastTriggered.severity].details,
      icon: hazard.icon,
      gradient: hazard.gradient,
      title: hazard.title,
    };
  }, [lastTriggered]);

  const handleTrigger = async (hazard: HazardConfig) => {
    try {
      const granted = await ensurePermissionsAsync();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in your settings to test mock alerts.');
        return;
      }
      await ensureAndroidChannelAsync();

      const sample = hazard.samples[severity];
      const title = `${sample.headline}`;
      const body = `${sample.details}`;

      await sendLocalNotification(title, body);
      setLastTriggered({ hazard: hazard.key, severity });
    } catch (error) {
      console.warn('Unable to send mock alert', error);
      Alert.alert('Mock alert failed', 'Something went wrong while sending the notification. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.title}>Mock Alerts Lab</Text>
            <Text style={styles.subtitle}>
              Craft sample weather alerts, preview messaging, and push a notification to your device instantly.
            </Text>
          </View>
        </View>

        <View style={styles.severitySection}>
          <Text style={styles.sectionHeading}>Select Severity</Text>
          <View style={styles.severityChips}>
            {SEVERITY_LABELS.map((item) => {
              const active = severity === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.severityChip, active && styles.severityChipActive]}
                  onPress={() => setSeverity(item.value)}
                >
                  <Text style={[styles.severityChipTitle, active && styles.severityChipTitleActive]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.severityChipSubtitle, active && styles.severityChipSubtitleActive]}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.hazardList}>
          {HAZARDS.map((hazard) => {
            const sample = hazard.samples[severity];
            const active = lastTriggered?.hazard === hazard.key;
            return (
              <LinearGradient
                key={hazard.key}
                colors={hazard.gradient as [ColorValue, ColorValue]}
                style={[styles.hazardCard, active && styles.hazardCardActive]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.hazardHeader}>
                  <View style={styles.hazardIcon}>{hazard.icon}</View>
                  <View style={styles.hazardText}>
                    <Text style={styles.hazardTitle}>{hazard.title}</Text>
                    <Text style={styles.hazardDescription}>{hazard.description}</Text>
                  </View>
                </View>
                <View style={styles.sampleBlock}>
                  <Text style={styles.sampleHeadline}>{sample.headline}</Text>
                  <Text style={styles.sampleDetails}>{sample.details}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleTrigger(hazard)}
                  style={[styles.triggerButton, { backgroundColor: SEVERITY_GRADIENTS[severity][0] }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="notifications" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.triggerButtonText}>Push test notification</Text>
                </TouchableOpacity>
              </LinearGradient>
            );
          })}
        </View>

        {lastPreview && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionHeading}>Latest Preview</Text>
            <LinearGradient
              colors={lastPreview.gradient as [ColorValue, ColorValue]}
              style={styles.previewCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.previewHeader}>
                <View style={styles.previewIcon}>{lastPreview.icon}</View>
                <View style={styles.previewText}>
                  <Text style={styles.previewTitle}>{lastPreview.title}</Text>
                  <Text style={styles.previewSeverity}>{severity.toUpperCase()} severity</Text>
                </View>
              </View>
              <Text style={styles.previewHeadline}>{lastPreview.headline}</Text>
              <Text style={styles.previewBody}>{lastPreview.details}</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  severitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  severityChips: {
    flexDirection: 'row',
    gap: 12,
  },
  severityChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#e2e8f0',
  },
  severityChipActive: {
    backgroundColor: '#0f172a',
  },
  severityChipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  severityChipTitleActive: {
    color: '#f8fafc',
  },
  severityChipSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: '#475569',
  },
  severityChipSubtitleActive: {
    color: '#cbd5f5',
  },
  hazardList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  hazardCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  hazardCardActive: {
    transform: [{ scale: 1.01 }],
  },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hazardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  hazardText: {
    flex: 1,
  },
  hazardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 4,
  },
  hazardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  sampleBlock: {
    backgroundColor: 'rgba(15,23,42,0.25)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sampleHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  sampleDetails: {
    fontSize: 13,
    color: 'rgba(248,250,252,0.85)',
    lineHeight: 18,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
  },
  triggerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  previewSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  previewCard: {
    borderRadius: 24,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 4,
  },
  previewSeverity: {
    fontSize: 12,
    color: 'rgba(248,250,252,0.85)',
  },
  previewHeadline: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  previewBody: {
    fontSize: 13,
    color: 'rgba(248,250,252,0.9)',
    lineHeight: 18,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useLocalization } from '@/context/LocalizationContext';
import {
  ALERT_TYPE_ORDER,
  AlertPreferenceMap,
  DEFAULT_ALERT_PREFERENCES,
  getAlertPreferences,
  saveAlertPreferences,
  countEnabledPreferences,
  getAlertTextToSpeechEnabled,
  saveAlertTextToSpeechPreference,
} from '@/utils/alertPreferences';
import { emitAlertPreferencesUpdated, emitAlertTextToSpeechUpdated } from '@/utils/eventBus';

const hazardIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  rain: 'rainy-outline',
  wind: 'leaf-outline',
  'temp-high': 'sunny-outline',
  'temp-low': 'snow-outline',
};

export default function AlertPreferencesScreen() {
  const { t, language } = useLocalization();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<AlertPreferenceMap>(DEFAULT_ALERT_PREFERENCES);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const stored = await getAlertPreferences();
        if (isMounted) {
          setPreferences(stored);
        }
        const speech = await getAlertTextToSpeechEnabled();
        if (isMounted) {
          setSpeechEnabled(language === 'en' ? speech : false);
        }
      } catch (error) {
        console.warn('[AlertPreferencesScreen] Unable to load preferences', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const enabledCount = useMemo(() => countEnabledPreferences(preferences), [preferences]);
  const allEnabled = enabledCount === ALERT_TYPE_ORDER.length;
  const noneEnabled = enabledCount === 0;
  const isSpeechSupported = language === 'en';

  const handleToggle = (key: keyof AlertPreferenceMap) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    setPreferences({ ...DEFAULT_ALERT_PREFERENCES });
  };

  const handleClearAll = () => {
    const cleared: AlertPreferenceMap = { ...DEFAULT_ALERT_PREFERENCES };
    ALERT_TYPE_ORDER.forEach(k => {
      cleared[k] = false;
    });
    setPreferences(cleared);
  };

  const handleSave = async () => {
    if (noneEnabled) {
      Alert.alert(t('settings.notificationPreferences.title'), t('settings.notificationPreferences.feedback.noneSelected'));
      return;
    }

    setIsSaving(true);
    try {
  const effectiveSpeech = isSpeechSupported ? speechEnabled : false;
      await Promise.all([
        saveAlertPreferences(preferences),
        saveAlertTextToSpeechPreference(effectiveSpeech),
      ]);
      emitAlertPreferencesUpdated(preferences);
      emitAlertTextToSpeechUpdated(effectiveSpeech);
      Alert.alert(t('settings.notificationPreferences.title'), t('settings.notificationPreferences.feedback.saved'));
      router.back();
    } catch (error) {
      console.warn('[AlertPreferencesScreen] Failed to save preferences', error);
      Alert.alert(
        t('settings.notificationPreferences.title'),
        t('settings.notificationPreferences.feedback.error')
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isSpeechSupported && speechEnabled) {
      setSpeechEnabled(false);
    }
  }, [isSpeechSupported, speechEnabled]);

  const handleTestSpeech = async () => {
    if (!isSpeechSupported) {
      Alert.alert(
        t('settings.notificationPreferences.title'),
        t('settings.notificationPreferences.textToSpeech.languageRestriction')
      );
      return;
    }

    if (!speechEnabled) {
      Alert.alert(
        t('settings.notificationPreferences.title'),
        t('settings.notificationPreferences.textToSpeech.testDisabled')
      );
      return;
    }

    setIsTestingSpeech(true);
    try {
      console.log('[AlertPreferencesScreen] Speech test triggered');
      const voices = await Speech.getAvailableVoicesAsync();
      const englishVoice = voices?.find(voice => voice?.language?.toLowerCase().startsWith('en'));

      if (!englishVoice) {
        console.warn('[AlertPreferencesScreen] No English TTS voice available', voices);
        Alert.alert(
          t('settings.notificationPreferences.title'),
          t('settings.notificationPreferences.textToSpeech.testVoiceUnavailable')
        );
        return;
      }

      const message = t('settings.notificationPreferences.textToSpeech.testMessage');
      await Speech.stop();
      console.log('[AlertPreferencesScreen] Playing sample alert', {
        voiceId: englishVoice.identifier,
        language: englishVoice.language,
      });
      Speech.speak(message, {
        language: englishVoice.language,
        voice: englishVoice.identifier,
        pitch: 1,
        rate: 0.98,
      });
    } catch (error) {
      console.warn('[AlertPreferencesScreen] Failed to play sample alert', error);
      Alert.alert(
        t('settings.notificationPreferences.title'),
        t('settings.notificationPreferences.textToSpeech.testError')
      );
    } finally {
      setIsTestingSpeech(false);
    }
  };

  const summaryLabel = useMemo(() => {
    if (enabledCount === 0) return t('settings.items.notificationsSummaryNone');
    if (enabledCount === ALERT_TYPE_ORDER.length) return t('settings.items.notificationsSummaryAll');
    return t('settings.items.notificationsSummarySome', { count: String(enabledCount) });
  }, [enabledCount, t]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, language === 'ta' && styles.headerTitleTamil]}>
            {t('settings.notificationPreferences.title')}
          </Text>
          <Text style={[styles.headerSubtitle, language === 'ta' && styles.headerSubtitleTamil]}>
            {summaryLabel}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.helperCard}>
            <Ionicons name="information-circle-outline" size={20} color="#0284c7" style={{ marginRight: 8 }} />
            <Text style={[styles.helperText, language === 'ta' && styles.helperTextTamil]}>
              {t('settings.notificationPreferences.helper')}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.pillButton, allEnabled && styles.pillButtonActive]} onPress={handleSelectAll}>
              <Ionicons name="checkmark-done-outline" size={18} color={allEnabled ? '#fff' : '#0284c7'} />
              <Text style={[styles.pillText, allEnabled && styles.pillTextActive]}>
                {t('settings.notificationPreferences.actions.selectAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillButton, noneEnabled && styles.pillButtonDanger]} onPress={handleClearAll}>
              <Ionicons name="close-circle-outline" size={18} color={noneEnabled ? '#fff' : '#dc2626'} />
              <Text style={[styles.pillText, noneEnabled && styles.pillTextDanger]}>
                {t('settings.notificationPreferences.actions.deselectAll')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardList}>
            {ALERT_TYPE_ORDER.map(key => {
              const iconName = hazardIcons[key] ?? 'notifications-outline';
              return (
                <View key={key} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBadge}>
                      <Ionicons name={iconName} size={20} color="#0f172a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, language === 'ta' && styles.cardTitleTamil]}>
                        {t(`settings.notificationPreferences.hazards.${key}.title`)}
                      </Text>
                      <Text style={[styles.cardDescription, language === 'ta' && styles.cardDescriptionTamil]}>
                        {t(`settings.notificationPreferences.hazards.${key}.description`)}
                      </Text>
                    </View>
                    <Switch
                      value={preferences[key]}
                      onValueChange={() => handleToggle(key)}
                      trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
                      thumbColor={preferences[key] ? '#0284c7' : '#f4f4f5'}
                    />
                  </View>
                </View>
              );
            })}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBadge}>
                  <Ionicons name="volume-high-outline" size={20} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, language === 'ta' && styles.cardTitleTamil]}>
                    {t('settings.notificationPreferences.textToSpeech.title')}
                  </Text>
                  <Text style={[styles.cardDescription, language === 'ta' && styles.cardDescriptionTamil]}>
                    {t('settings.notificationPreferences.textToSpeech.description')}
                  </Text>
                  {!isSpeechSupported && (
                    <View style={styles.noticePill}>
                      <Ionicons name="alert-circle-outline" size={14} color="#b91c1c" style={{ marginRight: 6 }} />
                      <Text style={styles.noticePillText}>
                        {t('settings.notificationPreferences.textToSpeech.languageRestriction')}
                      </Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={isSpeechSupported ? speechEnabled : false}
                  onValueChange={value => setSpeechEnabled(value)}
                  disabled={!isSpeechSupported}
                  trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
                  thumbColor={isSpeechSupported && speechEnabled ? '#0284c7' : '#f4f4f5'}
                />
              </View>
              {isSpeechSupported && (
                <TouchableOpacity
                  style={[
                    styles.testButton,
                    (!speechEnabled || isTestingSpeech) && styles.testButtonDisabled,
                  ]}
                  onPress={handleTestSpeech}
                  disabled={!speechEnabled || isTestingSpeech}
                >
                  {isTestingSpeech ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="play-outline"
                        size={16}
                        color={speechEnabled ? '#fff' : '#94a3b8'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.testButtonText,
                          (!speechEnabled || isTestingSpeech) && styles.testButtonTextDisabled,
                        ]}
                      >
                        {t('settings.notificationPreferences.textToSpeech.testAction')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || noneEnabled) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('settings.notificationPreferences.actions.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#ffffffcc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerTitleTamil: {
    fontSize: 18,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  headerSubtitleTamil: {
    fontSize: 12,
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  helperText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
  },
  helperTextTamil: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#e2f5ff',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  pillButtonActive: {
    backgroundColor: '#0284c7',
  },
  pillButtonDanger: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  pillText: {
    marginLeft: 8,
    color: '#0284c7',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  pillTextDanger: {
    color: '#dc2626',
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e2f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardTitleTamil: {
    fontSize: 15,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  cardDescriptionTamil: {
    fontSize: 12,
    lineHeight: 18,
  },
  noticePill: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticePillText: {
    color: '#b91c1c',
    fontSize: 12,
    flex: 1,
  },
  testButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284c7',
  },
  testButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: '#94a3b8',
  },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5f5',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

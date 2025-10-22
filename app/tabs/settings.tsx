import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation, usePathname } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SOSSettings, DEFAULT_SOS_SETTINGS, saveSOSSettings, getSOSSettings } from '../../utils/sos/sosService';
import { useLocalization, LanguageCode } from '../../context/LocalizationContext';
import Constants from 'expo-constants';
import {
  ALERT_TYPE_ORDER,
  AlertPreferenceMap,
  DEFAULT_ALERT_PREFERENCES,
  getAlertPreferences,
  countEnabledPreferences,
} from '../../utils/alertPreferences';
import { onAlertPreferencesUpdated } from '../../utils/eventBus';

const PRIMARY = '#5ba24f';
const SECONDARY = '#0284c7';
const DANGER = '#dc2626';
const CARD_BG = '#ffffff';

// Settings Section Component
const SettingsSection = ({
  title,
  icon,
  color = PRIMARY,
  children,
}: {
  title: string;
  icon: string;
  color?: string;
  children: React.ReactNode;
}) => {
  const { language } = useLocalization();
  const isTamil = language === 'ta';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} color="#fff" size={20} />
        </View>
        <Text style={[styles.sectionTitle, isTamil && styles.sectionTitleTamil]}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

// Settings Item Component
const SettingsItem = ({
  label,
  value,
  onPress,
  icon,
  showArrow = true,
  switchValue,
  onToggle,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: string;
  showArrow?: boolean;
  switchValue?: boolean;
  onToggle?: (value: boolean) => void;
}) => {
  const { language } = useLocalization();
  const isTamil = language === 'ta';

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingContent}>
        {icon && <Ionicons name={icon as any} size={20} color="#555" style={styles.settingIcon} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, isTamil && styles.settingLabelTamil]}>{label}</Text>
          {value && (
            <Text style={[styles.settingValue, isTamil && styles.settingValueTamil]}>{value}</Text>
          )}
        </View>
        {onToggle !== undefined && (
          <Switch
            value={switchValue}
            onValueChange={onToggle}
            trackColor={{ false: '#d1d5db', true: '#bae6fd' }}
            thumbColor={switchValue ? SECONDARY : '#f4f4f5'}
          />
        )}
        {showArrow && !onToggle && <Ionicons name="chevron-forward" size={20} color="#aaa" />}
      </View>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const searchParams = useLocalSearchParams();
  const rawReturnToParam = Array.isArray(searchParams.returnTo)
    ? searchParams.returnTo[0]
    : (searchParams.returnTo as string | undefined);
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const { t, language, setLanguage, availableLanguages, translateForLanguage } = useLocalization();
  const [sosSettings, setSOSSettings] = useState<SOSSettings>(DEFAULT_SOS_SETTINGS);
  const [darkMode, setDarkMode] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferenceMap>(DEFAULT_ALERT_PREFERENCES);
  const isTamil = language === 'ta';
  const totalAlertTypes = ALERT_TYPE_ORDER.length;

  const appVersion = useMemo(() => Constants.expoConfig?.version ?? '1.0.0', []);
  const alertSummary = useMemo(() => {
    const enabledCount = countEnabledPreferences(alertPreferences);
    if (enabledCount === 0) {
      return t('settings.items.notificationsSummaryNone');
    }
    if (enabledCount === totalAlertTypes) {
      return t('settings.items.notificationsSummaryAll');
    }
    return t('settings.items.notificationsSummarySome', { count: String(enabledCount) });
  }, [alertPreferences, t, totalAlertTypes]);

  const currentPath = useMemo(() => {
    if (typeof pathname === 'string' && pathname.length > 0) {
      return pathname;
    }
    return '/tabs/settings';
  }, [pathname]);

  const decodedReturnTo = useMemo(() => {
    if (typeof rawReturnToParam === 'string' && rawReturnToParam.length > 0) {
      try {
        const decoded = decodeURIComponent(rawReturnToParam);
        return decoded.startsWith('/') ? decoded : `/${decoded}`;
      } catch (error) {
        return rawReturnToParam.startsWith('/') ? rawReturnToParam : `/${rawReturnToParam}`;
      }
    }
    return undefined;
  }, [rawReturnToParam]);

  const handleBack = useCallback(() => {
    if (decodedReturnTo && decodedReturnTo !== currentPath) {
      router.replace(decodedReturnTo as any);
      return;
    }

    if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tabs');
  }, [navigation, router, decodedReturnTo, currentPath]);

  // Load SOS settings and dark mode when the screen loads
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSOSSettings();
      setSOSSettings(settings);
      // Load dark mode from local storage
      const storedDark = await Promise.resolve(
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('darkMode')
          : null
      );
      setDarkMode(storedDark === 'true');
    };
    loadSettings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadPreferences = async () => {
        try {
          const prefs = await getAlertPreferences();
          if (isActive) {
            setAlertPreferences(prefs);
          }
        } catch (error) {
          console.warn('[SettingsScreen] Failed to load alert preferences', error);
        }
      };

      loadPreferences();
      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onAlertPreferencesUpdated((prefs) => {
      setAlertPreferences(prefs);
    });
    return unsubscribe;
  }, []);

  // Toggle a SOS setting
  const toggleSOSSetting = async (key: keyof SOSSettings) => {
    const newSettings = {
      ...sosSettings,
      [key]: !sosSettings[key],
    };
    setSOSSettings(newSettings);
    await saveSOSSettings(newSettings);
  };

  // Toggle dark mode
  const toggleDarkMode = async () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('darkMode', newValue ? 'true' : 'false');
      }
      return newValue;
    });
  };

  const languageLabel = useMemo(() => t(`languages.${language}`), [language, t]);

  const handleLanguageChange = useCallback(
    async (code: LanguageCode) => {
      try {
        await setLanguage(code);
        setLanguageModalVisible(false);
        const successTitle = translateForLanguage(code, 'settings.title');
        const languageName = translateForLanguage(code, `languages.${code}`);
        const successMessage = translateForLanguage(code, 'settings.items.languageUpdated', {
          language: languageName,
        });
        Alert.alert(successTitle, successMessage);
      } catch (error) {
        console.error('Failed to change language', error);
        Alert.alert(t('settings.title'), t('settings.items.languageUpdateError'));
      }
    },
    [setLanguage, t, translateForLanguage]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil && styles.headerTitleTamil]}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Settings */}
        <SettingsSection title={t('settings.sections.account')} icon="person" color={PRIMARY}>
          <SettingsItem
            label={t('settings.items.viewProfile')}
            icon="person-circle"
            onPress={() => router.push('/tabs/profile' as any)}
          />
          <SettingsItem
            label={t('settings.items.changePassword')}
            icon="key"
            onPress={() => router.push('/auth/forgot-password' as any)}
          />
        </SettingsSection>

        {/* SOS Emergency Settings */}
        <SettingsSection title={t('settings.sections.sos')} icon="alert-circle" color={DANGER}>
          <SettingsItem
            label={t('settings.items.emergencyContacts')}
            value={t('settings.items.emergencyContactsValue', {
              count: String(userProfile?.emergencyContacts?.length || 0),
            })}
            onPress={() =>
              router.push({
                pathname: '/tabs/profile-edit/emergency-contacts',
                params: { returnTo: encodeURIComponent(currentPath) },
              } as any)
            }
          />
          {/* <SettingsItem
            label={t('settings.items.sosSettings')}
            onPress={() =>
              router.push({
                pathname: '/tabs/profile-edit/emergency-contacts',
                params: { returnTo: encodeURIComponent(currentPath) },
              } as any)
            }
          /> */}
          <SettingsItem
            label={t('settings.items.sosSettings')}
            onPress={() =>
              router.push({
                pathname: '/tabs/sos-settings',
                params: { returnTo: encodeURIComponent(currentPath) },
              } as any)
            }
          />
          <SettingsItem
            label={t('settings.items.sosHistory')}
            onPress={() =>
              router.push({
                pathname: '/tabs/sos-history',
                params: { returnTo: encodeURIComponent(currentPath) },
              } as any)
            }
          />
          <SettingsItem
            label={t('settings.items.shareBloodType')}
            switchValue={sosSettings.shareBloodType}
            onToggle={() => toggleSOSSetting('shareBloodType')}
          />
          <SettingsItem
            label={t('settings.items.shareMedicalConditions')}
            switchValue={sosSettings.shareMedicalConditions}
            onToggle={() => toggleSOSSetting('shareMedicalConditions')}
          />
          <SettingsItem
            label={t('settings.items.shareMedications')}
            switchValue={sosSettings.shareMedications}
            onToggle={() => toggleSOSSetting('shareMedications')}
          />
        </SettingsSection>

        {/* App Settings */}
        <SettingsSection title={t('settings.sections.app')} icon="settings" color={SECONDARY}>
          <SettingsItem
            label={t('settings.items.notifications')}
            value={alertSummary}
            onPress={() => router.push('/tabs/alert-preferences' as any)}
          />
          <SettingsItem
            label={t('settings.items.darkMode')}
            switchValue={darkMode}
            onToggle={toggleDarkMode}
          />
          <SettingsItem label={t('settings.items.locationServices')} onPress={() => {}} />
          <SettingsItem
            label={t('settings.items.language')}
            value={languageLabel}
            onPress={() => setLanguageModalVisible(true)}
          />
        </SettingsSection>

        {/* About & Support */}
        <SettingsSection title={t('settings.sections.about')} icon="information-circle" color="#6b7280">
          <SettingsItem label={t('settings.items.privacyPolicy')} onPress={() => {}} />
          <SettingsItem label={t('settings.items.terms')} onPress={() => {}} />
          <SettingsItem label={t('settings.items.helpSupport')} onPress={() => {}} />
          <SettingsItem
            label={t('settings.items.about')}
            value={t('settings.items.version', { version: appVersion })}
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            logout();
            router.replace('/auth/login' as any);
          }}
        >
          <Ionicons name="log-out" size={18} color={DANGER} />
          <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('settings.items.languageModalTitle')}</Text>
            {availableLanguages.map((langOption) => {
              const isSelected = language === langOption.code;
              return (
                <TouchableOpacity
                  key={langOption.code}
                  style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
                  onPress={() => {
                    void handleLanguageChange(langOption.code);
                  }}
                >
                  <Text
                    style={[styles.languageOptionText, isSelected && styles.languageOptionTextSelected]}
                  >
                    {t(langOption.labelKey)}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color={PRIMARY} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dcefdd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#ffffffcc',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerTitleTamil: {
    fontSize: 18,
    lineHeight: 22,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
  },
  sectionTitleTamil: {
    fontSize: 10,
    lineHeight: 22,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {},
  settingItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  settingLabelTamil: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingValueTamil: {
    fontSize: 12,
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  signOutText: {
    color: DANGER,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  languageOptionSelected: {
    backgroundColor: '#e6f4ea',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  languageOptionTextSelected: {
    color: PRIMARY,
  },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});

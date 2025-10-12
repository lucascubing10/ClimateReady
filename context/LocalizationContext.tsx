import React, { createContext, useContext, useEffect, useMemo, useCallback, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'si' | 'ta';

type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

type TranslationParams = Record<string, string | number>;

interface LocalizationContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
  availableLanguages: { code: LanguageCode; labelKey: string }[];
  translateForLanguage: (code: LanguageCode, key: string, params?: TranslationParams) => string;
}

const STORAGE_KEY = 'preferred_language';

const availableLanguages: { code: LanguageCode; labelKey: string }[] = [
  { code: 'en', labelKey: 'languages.en' },
  { code: 'si', labelKey: 'languages.si' },
  { code: 'ta', labelKey: 'languages.ta' },
];

const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    languages: {
      en: 'English',
      si: 'Sinhala',
      ta: 'Tamil',
    },
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
    },
    settings: {
      title: 'Settings',
      sections: {
        account: 'Account',
        sos: 'SOS Emergency',
        app: 'App Settings',
        about: 'About & Support',
      },
      items: {
        viewProfile: 'View & Edit Profile',
        changePassword: 'Change Password',
        emergencyContacts: 'Emergency Contacts',
        emergencyContactsValue: '{{count}} contacts added',
        sosSettings: 'SOS Settings',
        sosHistory: 'SOS History',
        shareBloodType: 'Share Blood Type',
        shareMedicalConditions: 'Share Medical Conditions',
        shareMedications: 'Share Medications',
        notifications: 'Notifications',
  notificationsSummaryAll: 'All alerts enabled',
  notificationsSummarySome: '{{count}} alerts enabled',
  notificationsSummaryNone: 'No alerts enabled',
        darkMode: 'Dark Mode',
        locationServices: 'Location Services',
        language: 'Language',
        languageModalTitle: 'Choose your language',
        languageUpdated: 'Language updated to {{language}}',
  languageUpdateError: 'Unable to update language. Please try again.',
        helpSupport: 'Help & Support',
        privacyPolicy: 'Privacy Policy',
        terms: 'Terms of Service',
        about: 'About ClimateReady',
        version: 'Version {{version}}',
      },
      signOut: 'Sign Out',
      languageNames: {
        en: 'English',
        si: 'Sinhala',
        ta: 'Tamil',
      },
      notificationPreferences: {
        title: 'Alert Preferences',
        description: 'Choose which weather alerts you want to receive.',
        helper: 'These choices apply to push notifications and the in-app alert list.',
        hazards: {
          rain: {
            title: 'Heavy rain alerts',
            description: 'Get notified when rainfall is expected to exceed your threshold.',
          },
          wind: {
            title: 'High wind alerts',
            description: 'Stay informed about strong winds that could affect safety.',
          },
          'temp-high': {
            title: 'High temperature alerts',
            description: 'Know when heat levels are forecast to reach risky levels.',
          },
          'temp-low': {
            title: 'Low temperature alerts',
            description: 'Receive updates when cold snaps are expected.',
          },
        },
        actions: {
          selectAll: 'Enable all',
          deselectAll: 'Disable all',
          save: 'Save preferences',
        },
        feedback: {
          saved: 'Alert preferences updated',
          noneSelected: 'Select at least one alert to stay informed.',
          error: 'Unable to save preferences. Please try again.',
        },
      },
    },
    home: {
      subtitle: 'Stay prepared, stay safe',
      sections: {
        alerts: 'Active Alerts',
        quickActions: 'Quick Actions',
        progress: 'Your Progress',
      },
      greetings: {
        morning: 'Good Morning 🌅',
        afternoon: 'Good Afternoon ☀️',
        evening: 'Good Evening 🌙',
      },
      quickActions: {
        safeZones: {
          title: 'Safe Zones',
          subtitle: 'Find nearby shelters',
        },
        toolkit: {
          title: 'Toolkit',
          subtitle: 'Emergency checklists',
        },
        community: {
          title: 'Community',
          subtitle: 'Connect with others',
        },
        mockAlerts: {
          title: 'Mock Alerts',
          subtitle: 'Test alert notifications',
        },
      },
      weather: {
        loading: 'Getting weather data...',
        unavailableTitle: 'Weather Unavailable',
        unavailableDescription: 'Unable to fetch weather data',
        permissionDenied: 'Permission to access location was denied',
        unableToGetLocation: 'Unable to get location',
        humidity: '💧 {{humidity}}%',
        wind: '💨 {{wind}} m/s',
      },
      alerts: {
        multipleHazards: 'Weather Alert',
        titles: {
          rain: 'Heavy Rain Forecast',
          wind: 'High Wind Forecast',
          tempHigh: 'High Temperature Forecast',
          tempLow: 'Low Temperature Forecast',
        },
        descriptions: {
          rain: 'Heavy rain ~ {{value}}mm/3h (≥ {{threshold}}mm)',
          wind: 'High wind {{value}} m/s (≥ {{threshold}} m/s)',
          tempHigh: 'High temp {{value}}°C (≥ {{threshold}}°C)',
          tempLow: 'Low temp {{value}}°C (≤ {{threshold}}°C)',
        },
        notificationFallback: 'Upcoming weather conditions exceed your thresholds.',
      },
      progress: {
        preparedness: 'Preparedness',
        preparednessSubtitle: '{{completed}}/{{total}} tasks',
        learning: 'Learning',
        learningSubtitle: '{{completed}}/{{total}} modules',
        trainingGame: 'Training Game',
        trainingSubtitle: '{{victories}} wins • {{games}} games',
        badges: 'Badges',
        badgesSubtitle: '{{count}} earned',
      },
      hero: {
        title: 'Stay Prepared, Stay Safe',
        subtitle: 'Your comprehensive emergency preparedness companion',
      },
    },
    mockAlerts: {
      title: 'Mock Alerts Lab',
      subtitle: 'Craft sample weather alerts, preview messaging, and push a notification to your device instantly.',
      severityHeading: 'Select Severity',
      severities: {
        low: { title: 'Low', subtitle: 'Advisory' },
        medium: { title: 'Medium', subtitle: 'Watch' },
        high: { title: 'High', subtitle: 'Warning' },
      },
      hazards: {
        rain: {
          title: 'Heavy Rainfall',
          description: 'Simulate flash flood or torrential rain alerts to test your readiness.',
          samples: {
            low: { headline: 'Light showers expected', details: 'Rainfall of 5mm within 3 hours. Keep an umbrella handy.' },
            medium: { headline: 'Moderate rain inbound', details: 'Persistent rainfall may lead to slick roads. Review your flood plan.' },
            high: { headline: 'Severe rain alert', details: 'Over 35mm rainfall in 3 hours. Move to higher ground immediately.' },
          },
        },
        wind: {
          title: 'Strong Winds',
          description: 'Test alerts for high wind scenarios, from breezy conditions to destructive gusts.',
          samples: {
            low: { headline: 'Breezy conditions', details: 'Wind speeds near 20 km/h. Secure light outdoor items.' },
            medium: { headline: 'High wind watch', details: 'Gusts up to 60 km/h expected. Avoid open areas.' },
            high: { headline: 'Damaging wind warning', details: 'Gusts exceeding 90 km/h. Stay indoors and avoid travel.' },
          },
        },
        'temp-high': {
          title: 'Extreme Heat',
          description: 'Check your response to heatwaves and heat advisory notifications.',
          samples: {
            low: { headline: 'Warm conditions', details: 'Temperatures rising to 30°C. Stay hydrated.' },
            medium: { headline: 'Heat advisory', details: 'Temps of 37°C expected. Limit outdoor activity.' },
            high: { headline: 'Heat emergency', details: 'Temps beyond 42°C. Seek cooled shelter immediately.' },
          },
        },
        'temp-low': {
          title: 'Extreme Cold',
          description: 'Run cold-weather mock alerts, from chilly breezes to freezing storms.',
          samples: {
            low: { headline: 'Chilly evening', details: 'Temperatures near 5°C. Dress in layers.' },
            medium: { headline: 'Frost advisory', details: 'Below freezing expected overnight. Protect fragile plants.' },
            high: { headline: 'Extreme cold warning', details: '−15°C wind chills. Limit time outdoors and check heating.' },
          },
        },
      },
      latestPreview: 'Latest Preview',
      previewSeverity: '{{level}} severity',
      triggerButton: 'Push test notification',
      alerts: {
        notificationsDisabledTitle: 'Notifications disabled',
        notificationsDisabledBody: 'Enable notifications in your settings to test mock alerts.',
        triggerErrorTitle: 'Mock alert failed',
        triggerErrorBody: 'Something went wrong while sending the notification. Please try again.',
      },
    },
    community: {
      filters: {
        all: 'All',
        general: 'General',
        flood: 'Flood',
        heatwave: 'Heat Wave',
        earthquake: 'Earthquake',
      },
      mineLabel: 'My Posts',
      mineLabelActive: 'My Posts ✓',
      createButton: '+ Post',
      errors: {
        title: 'Failed to fetch posts',
        generic: 'Failed to load posts.',
        retry: 'Retry',
      },
      statuses: {
        resolved: 'RESOLVED',
        blocked: 'BLOCKED',
        pending: 'PENDING REVIEW',
      },
      labels: {
        like: 'Like',
        comments: 'Comments',
      },
    },
  },
  si: {
    languages: {
      en: 'ඉංග්‍රීසි',
      si: 'සිංහල',
      ta: 'දෙමළ',
    },
    common: {
      cancel: 'ඉවත්වන්න',
      confirm: 'තහවුරු කරන්න',
      close: 'වසන්න',
    },
    settings: {
      title: 'සැකසීම්',
      sections: {
        account: 'ගිණුම',
        sos: 'SOS හදිසි',
        app: 'යෙදුම් සැකසීම්',
        about: 'තොරතුරු හා සහාය',
      },
      items: {
        viewProfile: 'පැතිකඩ බලන්න හා සංස්කරණය කරන්න',
        changePassword: 'මුරපදය වෙනස් කරන්න',
        emergencyContacts: 'හදිසි සම්බන්ධතා',
        emergencyContactsValue: 'සම්බන්ධතා {{count}}ක් එක් කර ඇත',
        sosSettings: 'SOS සැකසීම්',
        sosHistory: 'SOS ඉතිහාසය',
        shareBloodType: 'ලේ වර්ගය බෙදාගන්න',
        shareMedicalConditions: 'වෛද්‍ය තත්ව බෙදාගන්න',
        shareMedications: 'ඖෂධ තොරතුරු බෙදාගන්න',
        notifications: 'දැනුම්දීම්',
  notificationsSummaryAll: 'සියලු දැනුම්දීම් සක්‍රියයි',
  notificationsSummarySome: 'දැනුම්දීම් {{count}}ක් සක්‍රියයි',
  notificationsSummaryNone: 'දැනුම්දීම් කිසිවක් සක්‍රිය කර නැත',
        darkMode: 'අඳුරු තීරු',
        locationServices: 'ස්ථාන සේවා',
        language: 'භාෂාව',
        languageModalTitle: 'ඔබගේ භාෂාව තෝරන්න',
        languageUpdated: '{{language}} භාෂාවට මාරු විය',
  languageUpdateError: 'භාෂාව යාවත්කාල කළ නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.',
        helpSupport: 'උදව් සහ සහාය',
        privacyPolicy: 'පුද්ගලත්ව ප්‍රතිපත්තිය',
        terms: 'සේවා කොන්දේසි',
        about: 'ClimateReady ගැන',
        version: 'පිටපත් {{version}}',
      },
      signOut: 'විස්සන්න',
      languageNames: {
        en: 'ඉංග්‍රීසි',
        si: 'සිංහල',
        ta: 'දෙමළ',
      },
      notificationPreferences: {
        title: 'දැනුම්දීම් කැමැත්ත',
        description: 'ඔබට ලැබීමට කැමති කාලගුණ දැනුම්දීම් තෝරන්න.',
        helper: 'මෙම තේරීම් තල්ලු දැනුම්දීම් සහ යෙදුමේ දැනුම් දැක්වීම් දෙකටම බලපායි.',
        hazards: {
          rain: {
            title: 'බර වැසි දැනුම්දීම්',
            description: 'වැසි ප්‍රමාණය ඔබේ සීමාව ඉක්මුවහොත් දැනුවත් වන්න.',
          },
          wind: {
            title: 'උසස් සුළං දැනුම්දීම්',
            description: 'බලවත් සුළං අවදානම් මට්ටම් ගැන සූදානම් වන්න.',
          },
          'temp-high': {
            title: 'උණුසුම් උෂ්ණත්ව දැනුම්දීම්',
            description: 'උෂ්ණත්වය අවදානම් මට්ටම් වෙත ළඟාවන විට දැනුවත් වන්න.',
          },
          'temp-low': {
            title: 'අඩු උෂ්ණත්ව දැනුම්දීම්',
            description: 'සිසිලට හුදකලා තත්ත්වයන් පෙර දැනගන්න.',
          },
        },
        actions: {
          selectAll: 'සියල්ල සක්‍රිය කරන්න',
          deselectAll: 'සියල්ල අක්‍රිය කරන්න',
          save: 'කැමැත්ත සුරකින්න',
        },
        feedback: {
          saved: 'දැනුම්දීම් කැමැත්ත යාවත්කාල විය',
          noneSelected: 'ආරක්ෂාව සඳහා අවම වශයෙන් එක් දැනුම්දීමක්වත් සක්‍රිය කරන්න.',
          error: 'කැමැත්ත සුරක්ෂිත කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.',
        },
      },
    },
    home: {
      subtitle: 'සූදානම් වන්න, ආරක්ෂිතව සිටින්න',
      sections: {
        alerts: 'ක්‍රියාශීලී අනතුරු ඇඟවීම්',
        quickActions: 'වේගවත් ක්‍රියාමාර්ග',
        progress: 'ඔබගේ ප්‍රගතිය',
      },
      greetings: {
        morning: 'සුභ උදෑසනක් 🌅',
        afternoon: 'සුභ මධ්‍යහ්න වේලාවක් ☀️',
        evening: 'සුභ සැන්දෑවක් 🌙',
      },
      quickActions: {
        safeZones: {
          title: 'ආරක්ෂිත ප්‍රදේශ',
          subtitle: 'ආසන්න රැසවල වාසස්දන්',
        },
        toolkit: {
          title: 'මෙවලම් කට්ටලය',
          subtitle: 'හදිසි ලැයිස්තු',
        },
        community: {
          title: 'ප්‍රජාව',
          subtitle: 'අනෙකුත් අය සමඟ සම්බන්ධ වන්න',
        },
        mockAlerts: {
          title: 'අභ්‍යාස අනතුරු',
          subtitle: 'දැනුම්දීම් පිරික්සන්න',
        },
      },
      weather: {
        loading: 'කාලගුණ දත්ත ලබාගනිමින්...',
        unavailableTitle: 'කාලගුණය ලබාගත නොහැක',
        unavailableDescription: 'කාලගුණ දත්ත ලබා ගැනීමට නොහැකි විය',
        permissionDenied: 'ස්ථානයට ප්‍රවේශ වීමට අවසර නොලැබීය',
        unableToGetLocation: 'ස්ථානය ලබා ගැනීමට නොහැකි විය',
        humidity: '💧 ආර්ද්‍රතාව {{humidity}}%',
        wind: '💨 සුළං {{wind}} m/s',
      },
      alerts: {
        multipleHazards: 'කාලගුණ අනතුරු ඇඟවීම',
        titles: {
          rain: 'ඉහළ മഴ අනාවැකි',
          wind: 'ඉහළ සුළං අනාවැකි',
          tempHigh: 'ඉහළ උෂ්ණත්ව අනාවැකි',
          tempLow: 'අඩු උෂ්ණත්ව අනාවැකි',
        },
        descriptions: {
          rain: 'ඉහළ වැසි ~ {{value}}mm/3h (≥ {{threshold}}mm)',
          wind: 'ඉහළ සුළං {{value}} m/s (≥ {{threshold}} m/s)',
          tempHigh: 'ඉහළ උෂ්ණත්ව {{value}}°C (≥ {{threshold}}°C)',
          tempLow: 'අඩු උෂ්ණත්ව {{value}}°C (≤ {{threshold}}°C)',
        },
        notificationFallback: 'ඉදිරි කාලගුණ තත්ත්වයන් ඔබේ තීරු නියමයන් ඉක්මවයි.',
      },
      progress: {
        preparedness: 'සූදානම් බව',
        preparednessSubtitle: 'කාර්යයන් {{completed}}/{{total}}',
        learning: 'ඉගෙනීම',
        learningSubtitle: 'මොඩියුල {{completed}}/{{total}}',
        trainingGame: 'පුහුණු ක්‍රීඩාව',
        trainingSubtitle: 'ඊට {{victories}} ජයග්‍රහණ • ක්‍රීඩා {{games}}',
        badges: 'බැජ්',
        badgesSubtitle: 'ලභාගත් {{count}}',
      },
      hero: {
        title: 'සූදානම් වන්න, ආරක්ෂිතව සිටින්න',
        subtitle: 'ඔබගේ සම්පූර්ණ හදිසි සූදානම් සහාය',
      },
    },
    mockAlerts: {
      title: 'මොක් දැනුම්දීම් පරීක්ෂණශාලාව',
      subtitle: 'ආදර්ශ කාලගුණ දැනුම්දීම් සාදමින් පණිවිඩ පෙරදසුන් බලන්න හා උපාංගයට ක්ෂණිකව දැනුම්දීම් යවන්න.',
      severityHeading: 'දෘඩත්වය තෝරන්න',
      severities: {
        low: { title: 'අල්ප', subtitle: 'උපදෙස්' },
        medium: { title: 'මධ්‍ය', subtitle: 'අවවාදය' },
        high: { title: 'අධික', subtitle: 'අනතුරු ඇඟවීම' },
      },
      hazards: {
        rain: {
          title: 'දරුණු වැසි',
          description: 'ඔබගේ සූදානම පරීක්ෂා කිරීමට හදිසි ගංවතුර හෝ තද වැසි දැනුම්දීම් අනුකලනය කරන්න.',
          samples: {
            low: { headline: 'සුළු වැසි බලාපොරොත්තුවේ', details: 'පැය 3 කින් මිලිමිටර් 5 ක වැසි. කුඩයක් සකස් කර ගන්න.' },
            medium: { headline: 'මධ්‍යම වැසි ලඟාවේ', details: 'දිගු වැසි නිසා මාර්ග නම වැවී යා හැක. ඔබගේ ගංවතුර සැලසුම නැවත සලකා බලන්න.' },
            high: { headline: 'දරුණු වැසි අනතුරු ඇඟවීම', details: 'පැය 3 කින් මිලිමිටර් 35 ට වඩා වැසි. වහාම උසස් ස්ථානයකට ගොස් සිටින්න.' },
          },
        },
        wind: {
          title: 'බලවත් සුළං',
          description: 'සුළං තත්ත්වයන් සඳහා උචිත දැනුම්දීම් අත්හදා බැලීමට මෙම පැවැත්ම භාවිතා කරන්න.',
          samples: {
            low: { headline: 'සුළඟ වැඩිවෙමින්', details: 'කි.මී./පැ. 20 පමණ වේග. පැහැදිලිව තබා ඇති ද්‍රව්‍ය ආරක්ෂා කරන්න.' },
            medium: { headline: 'උස් සුළං අවවාදය', details: 'ගස්වැල් 60 කි.මී./පැ. දක්වා බලාපොරොත්තු. විවෘත ප්‍රදේශ වලින් වැළකී සිටින්න.' },
            high: { headline: 'අහිංසක නොවන සුළං අනතුරු', details: '90 කි.මී./පැ. ඉක්මවූ පීඩන සුළං. අභ්‍යන්තරයේ රඳවාගෙන ගමන් වළක්වා ගන්න.' },
          },
        },
        'temp-high': {
          title: 'අතිශයින් උණුසුම්',
          description: 'උණුසුම් තරංග හා උණුසුම් අනතුරු ඇඟවීම්ට ඔබගේ ප්‍රතිචාරය පරීක්ෂා කරන්න.',
          samples: {
            low: { headline: 'උෂ්ණත්වය ඉහළට', details: 'සෙල්සියස් 30° පමණ උෂ්ණත්වය. ජලය බොන්න.' },
            medium: { headline: 'උණුසුම් අනතුරු ඇඟවීම', details: 'සෙල්සියස් 37° බලාපොරොත්තු. පිටත ක්‍රියාකාරකම් සීමා කරන්න.' },
            high: { headline: 'උෂ්ණ හදිසි තත්ත්වය', details: 'සෙල්සියස් 42° ඉක්මවයි. වහාම සීතල ස්ථානයකට ගොස් සිටින්න.' },
          },
        },
        'temp-low': {
          title: 'අතිශයින් සිසිල',
          description: 'සිසිල සහ හිම වැසි තත්ත්වයන් සඳහා මොක් දැනුම්දීම් ක්‍රියාත්මක කරන්න.',
          samples: {
            low: { headline: 'සිසිලෙන් යුත් සැන්දෑව', details: 'සෙල්සියස් 5° සීමාවට ළඟා වෙයි. ස්තර කිහිපයක් පැළඳ ගන්න.' },
            medium: { headline: 'හිම අවවාදය', details: 'උෂ්ණත්වය රාත්‍රියේදී ශූන්‍යයට අඩු වෙයි. බරපතල සම්පත් ආරක්ෂා කරන්න.' },
            high: { headline: 'සිසිල හදිසි අනතුරු ඇඟවීම', details: '-15°සෙ. වායු සීතල. පිටත කාලය සීමා කර උෂ්ණත්ව පද්ධති පරීක්ෂා කරන්න.' },
          },
        },
      },
      latestPreview: 'නවතම පෙරදසුන',
      previewSeverity: '{{level}} දෘඩත්වය',
      triggerButton: 'මොක් දැනුම්දීමක් යවන්න',
      alerts: {
        notificationsDisabledTitle: 'දැනුම්දීම් අක්‍රියයි',
        notificationsDisabledBody: 'මොක් දැනුම්දීම් පරීක්ෂා කිරීමට සැකසීම් වල දැනුම්දීම් සක්‍රිය කරන්න.',
        triggerErrorTitle: 'මොක් දැනුම්දීම අසාර්ථකයි',
        triggerErrorBody: 'දැනුම්දීම යැවීමේදී දෝෂයක් මතුවිය. කරුණාකර නැවත උත්සාහ කරන්න.',
      },
    },
    community: {
      filters: {
        all: 'සියල්ල',
        general: 'සාමාන්‍ය',
        flood: 'ගංවතුර',
        heatwave: 'උණුසුම් තරංගය',
        earthquake: 'භූකම්පනය',
      },
      mineLabel: 'මගේ පළකරීම්',
      mineLabelActive: 'මගේ පළකරීම් ✓',
      createButton: '+ පළ කරන්න',
      errors: {
        title: 'පළකරීම් ලබා ගැනීමට අසාර්ථක විය',
        generic: 'පළකරීම් ලබා ගැනීමට නොහැකි විය.',
        retry: 'නැවත උත්සාහ කරන්න',
      },
      statuses: {
        resolved: 'විසඳා ඇත',
        blocked: 'අවහිර කර ඇත',
        pending: 'සමාලෝචනය බලාපොරොත්තුවේ',
      },
      labels: {
        like: 'අනුමත',
        comments: 'අදහස්',
      },
    },
  },
  ta: {
    languages: {
      en: 'ஆங்கிலம்',
      si: 'சிங்களம்',
      ta: 'தமிழ்',
    },
    common: {
      cancel: 'ரத்து செய்',
      confirm: 'உறுதிப்படுத்து',
      close: 'மூடு',
    },
    settings: {
      title: 'அமைப்புகள்',
      sections: {
        account: 'கணக்கு',
        sos: 'SOS அவசரம்',
        app: 'செயலி அமைப்புகள்',
        about: 'தகவலும் ஆதரவும்',
      },
      items: {
        viewProfile: 'சுயவிவரத்தைப் பார்க்கவும் திருத்தவும்',
        changePassword: 'கடவுச்சொல் மாற்று',
        emergencyContacts: 'அவசர தொடர்புகள்',
        emergencyContactsValue: '{{count}} தொடர்புகள் சேர்க்கப்பட்டன',
        sosSettings: 'SOS அமைப்புகள்',
        sosHistory: 'SOS வரலாறு',
        shareBloodType: 'இரத்த வகையை பகிர்',
        shareMedicalConditions: 'மருத்துவ நிலைகளை பகிர்',
        shareMedications: 'மருந்து தகவலை பகிர்',
        notifications: 'அறிவிப்புகள்',
  notificationsSummaryAll: 'அனைத்து எச்சரிக்கைகளும் இயக்கப்பட்டுள்ளது',
  notificationsSummarySome: '{{count}} எச்சரிக்கைகள் இயக்கப்பட்டுள்ளது',
  notificationsSummaryNone: 'எச்சரிக்கைகள் எதுவும் இயக்கப்படவில்லை',
        darkMode: 'இருள் பயன்முறை',
        locationServices: 'இட சேவைகள்',
        language: 'மொழி',
        languageModalTitle: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்',
        languageUpdated: '{{language}} மொழிக்கு மாற்றப்பட்டது',
  languageUpdateError: 'மொழியைப் புதுப்பிக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        helpSupport: 'உதவி & ஆதரவு',
        privacyPolicy: 'தனியுரிமைக் கொள்கை',
        terms: 'சேவை விதிமுறைகள்',
        about: 'ClimateReady பற்றி',
        version: 'பதிப்பு {{version}}',
      },
      signOut: 'வெளியேறு',
      languageNames: {
        en: 'ஆங்கிலம்',
        si: 'சிங்களம்',
        ta: 'தமிழ்',
      },
      notificationPreferences: {
        title: 'எச்சரிக்கை முன்னுரிமைகள்',
        description: 'நீங்கள் பெற விரும்பும் வானிலை எச்சரிக்கைகளைத் தேர்ந்தெடுக்கவும்.',
        helper: 'இந்தத் தேர்வுகள் push அறிவிப்புகளுக்கும் செயலியின் எச்சரிக்கை பட்டியலுக்கும் பொருந்தும்.',
        hazards: {
          rain: {
            title: 'தீவிர மழை எச்சரிக்கைகள்',
            description: 'மழை உங்கள் வரம்பை மீறும் போது அறிவிப்பைப் பெறுங்கள்.',
          },
          wind: {
            title: 'அதிக காற்று எச்சரிக்கைகள்',
            description: 'பாதுகாப்பை பாதிக்கக்கூடிய பலமான காற்று பற்றித் தகவலறிந்திருங்கள்.',
          },
          'temp-high': {
            title: 'அதிக வெப்பநிலை எச்சரிக்கைகள்',
            description: 'வெப்பம் ஆபத்தான நிலையை அடையும் போது தெரிந்திருங்கள்.',
          },
          'temp-low': {
            title: 'குறைந்த வெப்பநிலை எச்சரிக்கைகள்',
            description: 'குளிர் அதிகரிக்கும் நிலைகளை முன்கூட்டியே உணருங்கள்.',
          },
        },
        actions: {
          selectAll: 'அனைத்தையும் இயக்கவும்',
          deselectAll: 'அனைத்தையும் முடக்கவும்',
          save: 'முன்னுரிமைகளை சேமிக்கவும்',
        },
        feedback: {
          saved: 'எச்சரிக்கை முன்னுரிமைகள் புதுப்பிக்கப்பட்டது',
          noneSelected: 'தகவலறிந்திருப்பதற்கு குறைந்தபட்சம் ஒரு எச்சரிக்கையை இயக்கவும்.',
          error: 'முன்னுரிமைகளைச் சேமிக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        },
      },
    },
    home: {
      subtitle: 'தயார் இருங்கள், பாதுகாப்பாக இருங்கள்',
      sections: {
        alerts: 'செயலில் உள்ள எச்சரிக்கைகள்',
        quickActions: 'விரைவு செயல்கள்',
        progress: 'உங்கள் முன்னேற்றம்',
      },
      greetings: {
        morning: 'காலை வணக்கம் 🌅',
        afternoon: 'மதிய வணக்கம் ☀️',
        evening: 'மாலை வணக்கம் 🌙',
      },
      quickActions: {
        safeZones: {
          title: 'பாதுகாப்பு மண்டலம்',
          subtitle: 'அருகிலுள்ள தங்கும் இடங்கள்',
        },
        toolkit: {
          title: 'கருவிப்பெட்டி',
          subtitle: 'அவசர சரிபார்ப்பு பட்டியல்',
        },
        community: {
          title: 'சமூகம்',
          subtitle: 'மற்றவர்களுடன் இணைக',
        },
        mockAlerts: {
          title: 'பாசிட் எச்சரிக்கை',
          subtitle: 'அறிவிப்புகளைச் சோதிக்கவும்',
        },
      },
      weather: {
        loading: 'காலநிலை தரவைப் பெறுகிறது...',
        unavailableTitle: 'காலநிலையை பெற முடியவில்லை',
        unavailableDescription: 'காலநிலை தரவைக் கொண்டுவர இயலவில்லை',
        permissionDenied: 'இருப்பிட அணுகல் அனுமதி மறுக்கப்பட்டது',
        unableToGetLocation: 'இருப்பிடத்தை பெற முடியவில்லை',
        humidity: '💧 ஈரப்பதம் {{humidity}}%',
        wind: '💨 காற்று {{wind}} m/s',
      },
      alerts: {
        multipleHazards: 'காலநிலை எச்சரிக்கை',
        titles: {
          rain: 'கன மழை முன்னறிவிப்பு',
          wind: 'தீவிர காற்று முன்னறிவிப்பு',
          tempHigh: 'அதிக வெப்ப முன்னறிவிப்பு',
          tempLow: 'குறைந்த வெப்ப முன்னறிவிப்பு',
        },
        descriptions: {
          rain: 'கன மழை ~ {{value}}mm/3h (≥ {{threshold}}mm)',
          wind: 'காற்றின் வேகம் {{value}} m/s (≥ {{threshold}} m/s)',
          tempHigh: 'அதிக வெப்பம் {{value}}°C (≥ {{threshold}}°C)',
          tempLow: 'குறைந்த வெப்பம் {{value}}°C (≤ {{threshold}}°C)',
        },
        notificationFallback: 'வரவிருக்கும் காலநிலை நிலைகள் உங்கள் வரம்புகளை மீறுகின்றன.',
      },
      progress: {
        preparedness: 'தயார்நிலை',
        preparednessSubtitle: 'பணிகள் {{completed}}/{{total}}',
        learning: 'கற்றல்',
        learningSubtitle: 'தொகுதிகள் {{completed}}/{{total}}',
        trainingGame: 'பயிற்சி விளையாட்டு',
        trainingSubtitle: '{{victories}} வெற்றிகள் • {{games}} விளையாட்டுகள்',
        badges: 'பட்டைகள்',
        badgesSubtitle: '{{count}} பெற்றது',
      },
      hero: {
        title: 'தயார் இருங்கள், பாதுகாப்பாக இருங்கள்',
        subtitle: 'உங்கள் முழுமையான அவசர தயாரிப்பு துணை',
      },
    },
    mockAlerts: {
      title: 'பாசிட் எச்சரிக்கை ஆய்வகம்',
      subtitle: 'மாதிரி காலநிலை எச்சரிக்கைகளை உருவாக்கி, செய்திகள் முன்னோட்டமாக பார்க்கவும் மற்றும் உடனடியாக உங்கள் சாதனத்திற்கு அறிவிப்பை அனுப்புங்கள்.',
      severityHeading: 'அபாய நிலையைத் தேர்ந்தெடுக்கவும்',
      severities: {
        low: { title: 'குறைந்த', subtitle: 'அறிவுரை' },
        medium: { title: 'இடைநிலை', subtitle: 'கவனிப்பு' },
        high: { title: 'உயர்', subtitle: 'எச்சரிக்கை' },
      },
      hazards: {
        rain: {
          title: 'கடுமையான மழை',
          description: 'உங்கள் தயார்நிலையைப் பரிசோதிக்க திடீர் வெள்ளம் அல்லது கடும் மழை எச்சரிக்கைகளை உருவகப்படுத்துங்கள்.',
          samples: {
            low: { headline: 'இலேசான மழை எதிர்பார்க்கப்படுகிறது', details: '3 மணிநேரத்தில் 5மிமீ மழை. குடையை எடுத்துக்கொள்ளுங்கள்.' },
            medium: { headline: 'மிதமான மழை நெருங்குகிறது', details: 'தொடர்ச்சியான மழையால் சாலைகள் இலகுவாகலாம். உங்கள் வெள்ளத் திட்டத்தை மறுபார்வை செய்யுங்கள்.' },
            high: { headline: 'கடுமையான மழை எச்சரிக்கை', details: '3 மணிநேரத்தில் 35மிமீ-ஐ கடந்த மழை. உடனே உயர்ந்த இடத்துக்குச் செல்லுங்கள்.' },
          },
        },
        wind: {
          title: 'வலுவான காற்று',
          description: 'மெல்லிய காற்றில் இருந்து அழிவை ஏற்படுத்தும் புயல் வரை உள்ள சூழ்நிலைகளுக்கு எச்சரிக்கைகளைச் சோதியுங்கள்.',
          samples: {
            low: { headline: 'மிதமான காற்று நிலை', details: '20 கிமீ/மணி காற்று. எளிதில் அசையும் பொருள்களை பாதுகாக்கவும்.' },
            medium: { headline: 'உயர் காற்று கவனிப்பு', details: '60 கிமீ/மணி வரை காற்றடிகள். திறந்த இடங்களைத் தவிர்க்கவும்.' },
            high: { headline: 'அழிக்கும் காற்று எச்சரிக்கை', details: '90 கிமீ/மணிக்கு மேற்பட்ட காற்றடிகள். வீட்டுக்குள் இருக்கவும் மற்றும் பயணத்தைத் தவிர்க்கவும்.' },
          },
        },
        'temp-high': {
          title: 'அதிக சூடு',
          description: 'வெயில்காற்று மற்றும் வெப்ப எச்சரிக்கைகளுக்கு உங்கள் பிரதிகளைச் சோதியுங்கள்.',
          samples: {
            low: { headline: 'சூடான நிலை', details: 'வெப்பநிலை 30°C வரை உயரும். தண்ணீர் குடியுங்கள்.' },
            medium: { headline: 'வெப்ப எச்சரிக்கை', details: '37°C வரை வெப்பம் எதிர்பார்க்கப்படுகிறது. வெளிப்புற செயல்பாடுகளை குறைக்கவும்.' },
            high: { headline: 'வெப்ப அவசர நிலை', details: '42°C-ஐ கடந்த வெப்பம். உடனே குளிர்ந்த இடத்தை நாடுங்கள்.' },
          },
        },
        'temp-low': {
          title: 'அதிக குளிர்',
          description: 'சீற்றமான காற்று முதல் பனிப்புயல் வரை குளிர்கால எச்சரிக்கைகளை இயக்குங்கள்.',
          samples: {
            low: { headline: 'சிறு குளிர் மாலை', details: 'வெப்பநிலை 5°Cக்கு அருகில். பல அடுக்குகள் அணியுங்கள்.' },
            medium: { headline: 'பனி எச்சரிக்கை', details: 'இரவில் உறைபனி நிலைக்கு கீழ் விழும். நெகிழ்வான செடிகளை பாதுகாக்கவும்.' },
            high: { headline: 'பரம குளிர் எச்சரிக்கை', details: '-15°C காற்றழுத்தம். வெளியில் இருப்பதைத் தவிர்த்து சூடூட்டலைச் சரிபார்க்கவும்.' },
          },
        },
      },
      latestPreview: 'சமீபத்திய முன்னோட்டம்',
      previewSeverity: '{{level}} அபாய நிலை',
      triggerButton: 'சோதனை அறிவிப்பை அனுப்புங்கள்',
      alerts: {
        notificationsDisabledTitle: 'அறிவிப்புகள் முடக்கப்பட்டுள்ளன',
        notificationsDisabledBody: 'மொக் எச்சரிக்கைகளைச் சோதிக்க அமைப்புகளில் அறிவிப்புகளை இயக்குங்கள்.',
        triggerErrorTitle: 'மொக் எச்சரிக்கை தோல்வியடைந்தது',
        triggerErrorBody: 'அறிவிப்பை அனுப்பும்போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
      },
    },
    community: {
      filters: {
        all: 'அனைத்தும்',
        general: 'பொது',
        flood: 'வெள்ளம்',
        heatwave: 'வெயில் அலை',
        earthquake: 'நிலநடுக்கம்',
      },
      mineLabel: 'என் பதிவுகள்',
      mineLabelActive: 'என் பதிவுகள் ✓',
      createButton: '+ பதிவு',
      errors: {
        title: 'பதிவுகளை பெற முடியவில்லை',
        generic: 'பதிவுகளை ஏற்ற முடியவில்லை.',
        retry: 'மீண்டும் முயற்சிக்கவும்',
      },
      statuses: {
        resolved: 'தீர்க்கப்பட்டது',
        blocked: 'தடைக்கப்பட்டது',
        pending: 'மதிப்பாய்வு நிலுவையில்',
      },
      labels: {
        like: 'விருப்பு',
        comments: 'கருத்துகள்',
      },
    },
  },
};

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'si' || stored === 'ta' || stored === 'en') {
        setLanguageState(stored);
      }
    };

    loadLanguage();
  }, []);

  const persistLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    await AsyncStorage.setItem(STORAGE_KEY, code);
  }, []);

  const getTranslation = useCallback(
    (lang: LanguageCode, key: string): string | TranslationDictionary | undefined => {
      const parts = key.split('.');
      let node: string | TranslationDictionary | undefined = translations[lang];

      for (const part of parts) {
        if (node && typeof node === 'object') {
          node = (node as TranslationDictionary)[part];
        } else {
          node = undefined;
          break;
        }
      }

      return node as string | TranslationDictionary | undefined;
    },
    []
  );

  const applyParams = useCallback((template: string, params?: TranslationParams) => {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(.*?)\}\}/g, (_, token) => {
      const value = params[token.trim()];
      return value !== undefined ? String(value) : `{{${token}}}`;
    });
  }, []);

  const translate = useCallback(
    (key: string, params?: TranslationParams) => {
      const raw = getTranslation(language, key) ?? getTranslation('en', key);
      if (typeof raw !== 'string') {
        return key;
      }

      return applyParams(raw, params);
    },
    [applyParams, getTranslation, language]
  );

  const translateForLanguage = useCallback(
    (code: LanguageCode, key: string, params?: TranslationParams) => {
      const raw = getTranslation(code, key) ?? getTranslation('en', key);
      if (typeof raw !== 'string') {
        return key;
      }
      return applyParams(raw, params);
    },
    [applyParams, getTranslation]
  );

  const value = useMemo<LocalizationContextValue>(
    () => ({
      language,
      setLanguage: persistLanguage,
      t: translate,
      availableLanguages,
      translateForLanguage,
    }),
    [language, persistLanguage, translate, translateForLanguage]
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

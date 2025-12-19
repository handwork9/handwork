import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import ha from './locales/ha.json';
import yo from './locales/yo.json';
import ig from './locales/ig.json';
import pcm from './locales/pcm.json';

export const LANGUAGE_STORAGE_KEY = '@handwork_language';

// Available languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  'en-us': { name: 'English (US)', nativeName: 'English', flag: '🇺🇸' },
  ha: { name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  yo: { name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  ig: { name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
  pcm: { name: 'Pidgin', nativeName: 'Naija', flag: '🇳🇬' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Resources for i18next
const resources = {
  en: { translation: en },
  'en-us': { translation: en }, // Use English translations for US English
  ha: { translation: ha },
  yo: { translation: yo },
  ig: { translation: ig },
  pcm: { translation: pcm },
  // Fallback to English for languages without full translations yet
  fr: { translation: en },
  ar: { translation: en },
  pt: { translation: en },
  es: { translation: en },
  zh: { translation: en },
  sw: { translation: en },
};

// Get initial language synchronously
const getDeviceLanguage = (): string => {
  try {
    const locales = getLocales();
    const deviceLanguage = locales[0]?.languageCode || 'en';
    if (deviceLanguage in resources) {
      return deviceLanguage;
    }
    return 'en';
  } catch {
    return 'en';
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Load saved language preference after initialization
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLanguage) => {
  if (savedLanguage && savedLanguage in resources && savedLanguage !== i18n.language) {
    i18n.changeLanguage(savedLanguage);
  }
}).catch(console.error);

// Helper function to change language
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

// Helper function to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Helper function to check if a language is supported
export const isLanguageSupported = (languageCode: string): boolean => {
  return languageCode in SUPPORTED_LANGUAGES;
};

// Helper function to get language info
export const getLanguageInfo = (languageCode: string) => {
  return SUPPORTED_LANGUAGES[languageCode as SupportedLanguage] || SUPPORTED_LANGUAGES.en;
};

export default i18n;

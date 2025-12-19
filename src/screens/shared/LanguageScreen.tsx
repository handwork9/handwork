import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { changeLanguage, getCurrentLanguage } from '../../i18n';
import { FONTS } from '../../constants/theme';

const PRIMARY_COLOR = '#16A34A';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
}

interface LanguageGroup {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  languages: Language[];
}

const LANGUAGE_GROUPS: LanguageGroup[] = [
  {
    title: 'Suggested',
    icon: 'star-outline',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'United Kingdom' },
      { code: 'en-us', name: 'English', nativeName: 'English', flag: '🇺🇸', region: 'United States' },
    ],
  },
  {
    title: 'Nigerian Languages',
    icon: 'flag-outline',
    languages: [
      { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
      { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
      { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
      { code: 'pcm', name: 'Pidgin', nativeName: 'Naija', flag: '🇳🇬' },
    ],
  },
  {
    title: 'Other Languages',
    icon: 'globe-outline',
    languages: [
      { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
    ],
  },
];

const COVERAGE_DATA = [
  { name: 'English', percent: 100, color: '#16A34A', icon: 'checkmark-circle' as const },
  { name: 'Nigerian Languages', percent: 75, color: '#F59E0B', icon: 'time' as const },
  { name: 'Other Languages', percent: 60, color: '#3B82F6', icon: 'globe-outline' as const },
];

export default function LanguageScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());

  // Sync with i18n language on mount
  useEffect(() => {
    setSelectedLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const handleSelectLanguage = async (code: string) => {
    const prevLanguage = selectedLanguage;
    
    if (code === prevLanguage) return;
    
    try {
      await changeLanguage(code);
      setSelectedLanguage(code);
      
      const allLanguages = LANGUAGE_GROUPS.flatMap(g => g.languages);
      const language = allLanguages.find(l => l.code === code);
      
      if (language) {
        Alert.alert(
          t('language.languageChanged'),
          `App language has been set to ${language.name}.`,
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.',
        [{ text: t('common.ok') }]
      );
    }
  };

  const getCurrentLanguageInfo = () => {
    const allLanguages = LANGUAGE_GROUPS.flatMap(g => g.languages);
    return allLanguages.find(l => l.code === selectedLanguage);
  };

  const currentLang = getCurrentLanguageInfo();

  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('language.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Language Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={styles.heroTop}>
            <Text style={styles.heroFlag}>{currentLang?.flag || '🌐'}</Text>
            <View style={styles.heroCheckBadge}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {currentLang?.name || 'English'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{currentLang?.nativeName || 'English'}</Text>
          <View style={[styles.activeTag, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle" size={14} color={PRIMARY_COLOR} />
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        {/* Language Groups */}
        {LANGUAGE_GROUPS.map((group) => (
          <View key={group.title}>
            <View style={styles.sectionHeader}>
              <Ionicons name={group.icon} size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{group.title}</Text>
            </View>
            <View style={[styles.languageCard, { backgroundColor: cardBg }]}>
              {group.languages.map((language, index) => {
                const isSelected = selectedLanguage === language.code;
                const isLast = index === group.languages.length - 1;

                return (
                  <View key={language.code}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectLanguage(language.code)}
                      style={[
                        styles.languageRow,
                        isSelected && { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4' }
                      ]}
                    >
                      <Text style={styles.flag}>{language.flag}</Text>
                      <View style={styles.languageInfo}>
                        <View style={styles.languageNameRow}>
                          <Text style={[styles.languageName, { color: colors.text }]}>
                            {language.name}
                          </Text>
                          {language.region && (
                            <Text style={[styles.languageRegion, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>({language.region})</Text>
                          )}
                        </View>
                        <Text style={[styles.nativeName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{language.nativeName}</Text>
                      </View>
                      <View style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected
                      ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Translation Coverage */}
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Translation Coverage</Text>
        </View>
        <View style={[styles.coverageCard, { backgroundColor: cardBg }]}>
          {COVERAGE_DATA.map((item, index) => (
            <View key={item.name}>
              <View style={styles.coverageRow}>
                <View style={[styles.coverageIcon, { backgroundColor: isDark ? `${item.color}20` : `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.coverageInfo}>
                  <Text style={[styles.coverageTitle, { color: colors.text }]}>{item.name}</Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${item.percent}%`, backgroundColor: item.color }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.progressPercent, { color: item.color }]}>
                      {item.percent}%
                    </Text>
                  </View>
                </View>
              </View>
              {index < COVERAGE_DATA.length - 1 && <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
            </View>
          ))}
        </View>

        {/* Help Translate Card */}
        <TouchableOpacity
          style={[styles.helpCard, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8' }]}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('HelpTranslate')}
        >
          <View style={styles.helpContent}>
            <View style={[styles.helpIconContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name="heart" size={22} color="#EC4899" />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>
                Help Us Translate
              </Text>
              <Text style={[styles.helpDescription, { color: isDark ? '#F472B6' : '#BE185D' }]}>
                Contribute translations and help make Handwork accessible to more people
              </Text>
            </View>
          </View>
          <View style={styles.helpArrow}>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </View>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
          <Ionicons name="information-circle" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
            Some content like product descriptions and farmer details may appear in their original language.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,    overflow: 'hidden',
    position: 'relative',
  },
  heroDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: PRIMARY_COLOR,
    opacity: 0.08,
  },
  decorationCircle1: {
    width: 120,
    height: 120,
    top: 0,
    right: 0,
  },
  decorationCircle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 60,
    opacity: 0.05,  },
  heroTop: {
    position: 'relative',
    marginBottom: 12,
  },
  heroFlag: {
    fontSize: 56,
  },
  heroCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    fontFamily: FONTS.semiBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  languageRowSelected: {
    backgroundColor: '#F0FDF4',
  },
  flag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
  },
  languageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  languageRegion: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
  },
  nativeName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: PRIMARY_COLOR,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_COLOR,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 58,
  },
  coverageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  coverageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverageInfo: {
    flex: 1,
  },
  coverageTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    width: 42,
    textAlign: 'right',
    fontFamily: FONTS.bold,
  },
  helpCard: {
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  helpDescription: {
    fontSize: 13,
    color: '#BE185D',
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  helpArrow: {
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

interface LanguageProject {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  progress: number;
  contributors: number;
  stringsRemaining: number;
}

const LANGUAGE_PROJECTS: LanguageProject[] = [
  { id: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', progress: 78, contributors: 12, stringsRemaining: 156 },
  { id: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', progress: 72, contributors: 8, stringsRemaining: 198 },
  { id: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', progress: 75, contributors: 10, stringsRemaining: 175 },
  { id: 'pcm', name: 'Pidgin', nativeName: 'Naija', flag: '🇳🇬', progress: 65, contributors: 6, stringsRemaining: 245 },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', progress: 82, contributors: 15, stringsRemaining: 126 },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', progress: 45, contributors: 4, stringsRemaining: 385 },
  { id: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', progress: 58, contributors: 5, stringsRemaining: 294 },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', progress: 62, contributors: 7, stringsRemaining: 266 },
  { id: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', progress: 35, contributors: 3, stringsRemaining: 455 },
  { id: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', progress: 40, contributors: 4, stringsRemaining: 420 },
];

const STATS = [
  { icon: 'globe' as const, value: '10', label: 'Languages', color: '#3B82F6' },
  { icon: 'people' as const, value: '74', label: 'Contributors', color: '#16A34A' },
  { icon: 'document-text' as const, value: '7K+', label: 'Strings', color: '#F59E0B' },
];

const STEPS = [
  { number: '1', title: 'Choose a language', description: 'Select a language you speak fluently', icon: 'language-outline' as const },
  { number: '2', title: 'Translate strings', description: 'Review and translate app text', icon: 'create-outline' as const },
  { number: '3', title: 'Review & submit', description: 'Your translations will be reviewed', icon: 'checkmark-circle-outline' as const },
  { number: '4', title: 'Earn rewards', description: 'Get points for approved translations', icon: 'gift-outline' as const },
];

const REWARDS = [
  { title: 'Per String', description: 'Earn points for each approved translation', value: '+2', icon: 'star' as const },
  { title: 'Review Bonus', description: 'Extra points for reviewing others\' work', value: '+1', icon: 'checkmark-done' as const },
  { title: 'Completion Bonus', description: 'Bonus when a language reaches 100%', value: '+500', icon: 'trophy' as const },
];

export default function HelpTranslateScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#6EE7B7'; // soft green
    if (progress >= 50) return '#FCD34D'; // soft amber
    return '#FCA5A5'; // soft red
  };

  const handleStartTranslating = (language: LanguageProject) => {
    Alert.alert(
      `Translate to ${language.name}`,
      `You're about to help translate Handwork to ${language.nativeName}. You'll be redirected to our translation platform.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => Linking.openURL('https://translate.handwork.app') },
      ]
    );
  };

  const handleSuggestLanguage = () => {
    Alert.alert(
      'Suggest a Language',
      'Would you like to suggest a new language for translation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Us', onPress: () => (navigation as any).navigate('ContactUs') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Translate</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={[styles.heroIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }]}>
            <Ionicons name="language" size={36} color="#8B5CF6" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Make Handwork Global</Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Help us translate Handwork into your language and earn rewards for your contributions
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? `${stat.color}20` : `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>How It Works</Text>
        </View>
        <View style={[styles.stepsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {STEPS.map((step, index) => (
            <View key={step.number}>
              <View style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepNumber, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }]}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  {index < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]} />}
                </View>
                <View style={styles.stepContent}>
                  <View style={[styles.stepIconBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF' }]}>
                    <Ionicons name={step.icon} size={16} color="#8B5CF6" />
                  </View>
                  <View style={styles.stepText}>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                    <Text style={[styles.stepDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{step.description}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Translation Projects */}
        <View style={styles.sectionHeader}>
          <Ionicons name="globe-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Translation Projects</Text>
          <View style={[styles.projectCount, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
            <Text style={[styles.projectCountText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{LANGUAGE_PROJECTS.length}</Text>
          </View>
        </View>
        <View style={[styles.projectsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {LANGUAGE_PROJECTS.map((project, index) => {
            const isLast = index === LANGUAGE_PROJECTS.length - 1;
            const isExpanded = expandedProject === project.id;
            const progressColor = getProgressColor(project.progress);

            return (
              <View key={project.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setExpandedProject(isExpanded ? null : project.id)}
                  style={[styles.projectRow, isExpanded && { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}
                >
                  <Text style={styles.flag}>{project.flag}</Text>
                  <View style={styles.projectInfo}>
                    <View style={styles.projectNameRow}>
                      <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                      <Text style={[styles.projectNative, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>({project.nativeName})</Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]}>
                        <View 
                          style={[styles.progressFill, { width: `${project.progress}%`, backgroundColor: progressColor }]} 
                        />
                      </View>
                      <Text style={[styles.progressPercent, { color: progressColor }]}>{project.progress}%</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={isDark ? '#6B7280' : '#9CA3AF'} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.expandedContent, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
                    <View style={styles.expandedStats}>
                      <View style={styles.expandedStat}>
                        <Ionicons name="people-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.expandedStatText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{project.contributors} contributors</Text>
                      </View>
                      <View style={styles.expandedStat}>
                        <Ionicons name="document-text-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        <Text style={[styles.expandedStatText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{project.stringsRemaining} remaining</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.translateButton}
                      onPress={() => handleStartTranslating(project)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="language" size={18} color="#FFFFFF" />
                      <Text style={styles.translateButtonText}>Start Translating</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isLast && !isExpanded && <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
              </View>
            );
          })}
        </View>

        {/* Suggest Language */}
        <TouchableOpacity
          style={[styles.suggestCard, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#F0FDF4' }]}
          activeOpacity={0.7}
          onPress={handleSuggestLanguage}
        >
          <View style={styles.suggestContent}>
            <View style={[styles.suggestIconContainer, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.3)' : '#DCFCE7' }]}>
              <Ionicons name="add" size={22} color="#16A34A" />
            </View>
            <View style={styles.suggestTextContainer}>
              <Text style={[styles.suggestTitle, { color: colors.text }]}>Suggest a Language</Text>
              <Text style={[styles.suggestDescription, { color: isDark ? '#4ADE80' : '#16A34A' }]}>Don't see your language? Let us know!</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
        </TouchableOpacity>

        {/* Translation Rewards */}
        <View style={styles.sectionHeader}>
          <Ionicons name="gift-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Rewards</Text>
        </View>
        <View style={[styles.rewardsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {REWARDS.map((reward, index) => (
            <View key={reward.title}>
              <View style={styles.rewardRow}>
                <View style={[styles.rewardIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                  <Ionicons name={reward.icon} size={18} color="#F59E0B" />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.title}</Text>
                  <Text style={[styles.rewardDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{reward.description}</Text>
                </View>
                <View style={[styles.rewardValueBadge, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7' }]}>
                  <Text style={styles.rewardValue}>{reward.value}</Text>
                </View>
              </View>
              {index < REWARDS.length - 1 && <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
            </View>
          ))}
        </View>

        {/* Info Note */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
          <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
            All translations are reviewed by our team and native speakers to ensure quality and accuracy.
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
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
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
    backgroundColor: '#8B5CF6',
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
    opacity: 0.05,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
  },
  projectCount: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  projectCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
    fontFamily: FONTS.bold,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 16,
  },
  stepIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  projectsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  projectRowExpanded: {
    backgroundColor: '#F9FAFB',
  },
  flag: {
    fontSize: 32,
  },
  projectInfo: {
    flex: 1,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  projectNative: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
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
  expandedContent: {
    padding: 14,
    paddingTop: 0,
    backgroundColor: '#F9FAFB',
  },
  expandedStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  expandedStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  translateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 58,
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  suggestContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestTextContainer: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  suggestDescription: {
    fontSize: 13,
    color: '#16A34A',
    fontFamily: FONTS.regular,
  },
  rewardsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  rewardDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  rewardValueBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: FONTS.bold,
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

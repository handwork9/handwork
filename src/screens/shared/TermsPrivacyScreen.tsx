import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

interface Section {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: string;
}

const TERMS_SECTIONS: Section[] = [
  {
    id: '1',
    title: 'Acceptance of Terms',
    icon: 'checkmark-circle-outline',
    content: 'By accessing and using the Handwork application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
  },
  {
    id: '2',
    title: 'User Accounts',
    icon: 'person-outline',
    content: 'You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.',
  },
  {
    id: '3',
    title: 'Product Listings',
    icon: 'basket-outline',
    content: 'Farmers are responsible for the accuracy of their product listings, including descriptions, prices, and availability. Handwork reserves the right to remove listings that violate our policies or contain misleading information.',
  },
  {
    id: '4',
    title: 'Payments & Refunds',
    icon: 'card-outline',
    content: 'All payments are processed securely through our payment partners. Refunds may be issued for damaged or incorrect items at our discretion. Request refunds within 24 hours of delivery for eligible orders.',
  },
  {
    id: '5',
    title: 'Delivery Terms',
    icon: 'bicycle-outline',
    content: 'Delivery times are estimates and may vary based on location and rider availability. We are not liable for delays caused by weather, traffic, or circumstances beyond our control. Track your orders in real-time through the app.',
  },
  {
    id: '6',
    title: 'Prohibited Activities',
    icon: 'close-circle-outline',
    content: 'Users may not engage in fraudulent transactions, harassment, impersonation, or any illegal activities. Violation of these rules will result in account suspension or termination and may be reported to authorities.',
  },
  {
    id: '7',
    title: 'Limitation of Liability',
    icon: 'shield-outline',
    content: 'Handwork shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid by you in the past 12 months.',
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    id: '1',
    title: 'Information We Collect',
    icon: 'folder-outline',
    content: 'We collect information you provide directly, including name, email, phone number, delivery addresses, and payment details. We also collect usage data, device information, and location data when you use our app.',
  },
  {
    id: '2',
    title: 'How We Use Your Data',
    icon: 'analytics-outline',
    content: 'We use your information to process orders, facilitate deliveries, communicate updates, improve our services, personalize your experience, and ensure security. We may also use data for analytics and marketing with your consent.',
  },
  {
    id: '3',
    title: 'Data Sharing',
    icon: 'share-outline',
    content: 'We share data with farmers to fulfill orders, riders for deliveries, and payment processors for transactions. We may also share anonymized analytics with partners. We never sell your personal data to third parties.',
  },
  {
    id: '4',
    title: 'Data Security',
    icon: 'lock-closed-outline',
    content: 'We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    id: '5',
    title: 'Your Rights',
    icon: 'hand-right-outline',
    content: 'You have the right to access, update, or delete your personal information. You can opt out of marketing communications, request data portability, and withdraw consent for data processing at any time.',
  },
  {
    id: '6',
    title: 'Cookies & Tracking',
    icon: 'eye-outline',
    content: 'We use cookies and similar technologies to enhance your experience, analyze usage, and deliver personalized content. You can manage cookie preferences in your device settings.',
  },
  {
    id: '7',
    title: 'Data Retention',
    icon: 'time-outline',
    content: 'We retain your personal data for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.',
  },
  {
    id: '8',
    title: 'Contact Us',
    icon: 'mail-outline',
    content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@handwork.app. We will respond to your request within 30 days.',
  },
];

type TabType = 'terms' | 'privacy';

export default function TermsPrivacyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('terms');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const currentSections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Page Title */}
      <View style={styles.pageTitleSection}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Legal</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Terms of service & privacy policy</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text-outline"
              size={18}
              color={activeTab === 'terms' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={[styles.tabText, { color: isDark ? '#9CA3AF' : '#6B7280' }, activeTab === 'terms' && styles.activeTabText]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={activeTab === 'privacy' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280'}
            />
            <Text style={[styles.tabText, { color: isDark ? '#9CA3AF' : '#6B7280' }, activeTab === 'privacy' && styles.activeTabText]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.heroIcon, { backgroundColor: activeTab === 'terms' ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF') : (isDark ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4') }]}>
            <Ionicons
              name={activeTab === 'terms' ? 'document-text' : 'shield-checkmark'}
              size={28}
              color={activeTab === 'terms' ? '#3B82F6' : '#16A34A'}
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {activeTab === 'terms' 
              ? 'Last updated: January 2025'
              : 'Your privacy matters to us'}
          </Text>
        </View>

        {/* Sections */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          {activeTab === 'terms' ? '7 Sections' : '8 Sections'}
        </Text>
        
        <View style={[styles.sectionsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {currentSections.map((section, index) => {
            const isExpanded = expandedSections.includes(section.id);
            const isLast = index === currentSections.length - 1;
            
            return (
              <View key={section.id}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.sectionIcon,
                    { backgroundColor: activeTab === 'terms' ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF') : (isDark ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4') }
                  ]}>
                    <Ionicons
                      name={section.icon}
                      size={18}
                      color={activeTab === 'terms' ? '#3B82F6' : '#16A34A'}
                    />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
                    {section.title}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDark ? '#6B7280' : '#9CA3AF'}
                  />
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.sectionContent}>
                    <Text style={[styles.sectionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{section.content}</Text>
                  </View>
                )}
                
                {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
              </View>
            );
          })}
        </View>

        {/* Contact Card */}
        <View style={[styles.contactCard, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
          <View style={[styles.contactIconContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="help-circle" size={24} color="#6366F1" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Have questions?
            </Text>
            <Text style={[styles.contactSubtitle, { color: isDark ? '#818CF8' : '#6366F1' }]}>
              Contact us at support@handwork.app
            </Text>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Document Version 2.1</Text>
          <Text style={styles.versionText}>Effective: January 1, 2025</Text>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  pageTitleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#16A34A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  sectionsCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  sectionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6366F1',
    fontFamily: FONTS.regular,
  },
  versionInfo: {
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
  },
});

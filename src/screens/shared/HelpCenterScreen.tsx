import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as unknown as { __turboModuleProxy?: unknown }).__turboModuleProxy
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'orders', name: 'Orders', icon: 'bag-handle-outline', color: '#007AFF' },
  { id: 'payments', name: 'Payments', icon: 'card-outline', color: '#16A34A' },
  { id: 'delivery', name: 'Delivery', icon: 'bicycle-outline', color: '#F59E0B' },
  { id: 'account', name: 'Account', icon: 'person-outline', color: '#8B5CF6' },
];

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'How do I track my order?',
    answer: 'Go to the Orders tab and tap on your order. You\'ll see real-time updates on your order status, including when it\'s being prepared, out for delivery, and delivered.',
    category: 'orders',
  },
  {
    id: '2',
    question: 'How do I cancel an order?',
    answer: 'Go to Orders, select the order you want to cancel, and tap "Cancel Order". Note that orders can only be cancelled while payment is still processing.',
    category: 'orders',
  },
  {
    id: '3',
    question: 'What payment methods are accepted?',
    answer: 'We accept credit/debit cards (Visa, Mastercard), bank transfers, mobile money, and wallet balance.',
    category: 'payments',
  },
  {
    id: '4',
    question: 'How do I add money to my wallet?',
    answer: 'Go to Wallet from your profile, tap "Top Up", enter the amount, select your payment method, and confirm.',
    category: 'payments',
  },
  {
    id: '5',
    question: 'How long does delivery take?',
    answer: 'Typically 1-3 days depending on your location and the farmer\'s proximity. You can see estimated delivery time at checkout.',
    category: 'delivery',
  },
  {
    id: '6',
    question: 'Can I schedule a delivery?',
    answer: 'Yes! During checkout, choose your preferred delivery date and time slot for flexible scheduling.',
    category: 'delivery',
  },
  {
    id: '7',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Security > Change Password. Enter your current password, then set your new password.',
    category: 'account',
  },
  {
    id: '8',
    question: 'How do I update my profile?',
    answer: 'Go to Profile > Edit Profile to update your name, phone number, email, and profile picture.',
    category: 'account',
  },
];

export default function HelpCenterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  const toggleFAQ = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredFAQs = FAQS.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <Text style={[styles.pageTitle, { color: colors.text }]}>Help Center</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>How can we help you today?</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="search" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for help..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('LiveChat')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }]}>
              <Ionicons name="chatbubbles" size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Live Chat</Text>
            <Text style={[styles.quickActionSubtitle, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>24/7 support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('ContactUs')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7' }]}>
              <Ionicons name="call" size={22} color="#16A34A" />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Call Us</Text>
            <Text style={[styles.quickActionSubtitle, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>Talk to us</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('ContactUs')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
              <Ionicons name="mail" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.quickActionTitle, { color: colors.text }]}>Email</Text>
            <Text style={[styles.quickActionSubtitle, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>Get response</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Browse by topic</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: !selectedCategory ? '#16A34A' : isDark ? colors.card : '#FFFFFF' },
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryChipText,
              { color: !selectedCategory ? '#FFFFFF' : colors.text }
            ]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isSelected ? category.color : isDark ? colors.card : '#FFFFFF' },
                ]}
                onPress={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : category.color}
                />
                <Text style={[
                  styles.categoryChipText,
                  { color: isSelected ? '#FFFFFF' : colors.text }
                ]}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQs */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Frequently asked questions</Text>
        <View style={[styles.faqCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Try a different search or category</Text>
            </View>
          ) : (
            filteredFAQs.map((faq, index) => {
              const isExpanded = expandedFAQs.has(faq.id);
              const isLast = index === filteredFAQs.length - 1;
              const category = CATEGORIES.find(c => c.id === faq.category);

              return (
                <View key={faq.id}>
                  <TouchableOpacity
                    style={styles.faqItem}
                    activeOpacity={0.7}
                    onPress={() => toggleFAQ(faq.id)}
                  >
                    <View style={[styles.faqIconContainer, { backgroundColor: `${category?.color}15` }]}>
                      <Ionicons name={category?.icon || 'help-outline'} size={18} color={category?.color} />
                    </View>
                    <View style={styles.faqContent}>
                      <Text style={[styles.faqQuestion, { color: colors.text }]} numberOfLines={isExpanded ? undefined : 2}>
                        {faq.question}
                      </Text>
                      {isExpanded && (
                        <Text style={[styles.faqAnswer, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{faq.answer}</Text>
                      )}
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isDark ? '#6B7280' : '#9CA3AF'}
                    />
                  </TouchableOpacity>
                  {!isLast && <View style={[styles.faqDivider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />}
                </View>
              );
            })
          )}
        </View>

        {/* Still Need Help Card */}
        <View style={[styles.helpCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.helpCardContent}>
            <View style={[styles.helpIconContainer, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }]}>
              <Ionicons name="headset" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.helpTextContainer}>
              <Text style={[styles.helpTitle, { color: colors.text }]}>Still need help?</Text>
              <Text style={[styles.helpSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Our team is ready to assist</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => (navigation as any).navigate('ContactUs')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
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
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    fontFamily: FONTS.regular,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  categoriesScroll: {
    paddingBottom: 4,
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#16A34A',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  faqCard: {
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
  faqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    fontFamily: FONTS.semiBold,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 62,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: FONTS.regular,
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  helpCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  helpIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});

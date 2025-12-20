import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

interface ContactOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  action: string;
  value: string;
}

const CONTACT_OPTIONS: ContactOption[] = [
  {
    id: '1',
    icon: 'chatbubbles',
    title: 'Live Chat',
    subtitle: 'Available 24/7',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    action: 'chat',
    value: '',
  },
  {
    id: '2',
    icon: 'call',
    title: 'Call Us',
    subtitle: '+234 123 456 7890',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    action: 'phone',
    value: '+2341234567890',
  },
  {
    id: '3',
    icon: 'logo-whatsapp',
    title: 'WhatsApp',
    subtitle: 'Quick responses',
    color: '#25D366',
    bgColor: '#D1FAE5',
    action: 'whatsapp',
    value: '+2341234567890',
  },
  {
    id: '4',
    icon: 'mail',
    title: 'Email',
    subtitle: 'support@handwork.com',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    action: 'email',
    value: 'support@handwork.com',
  },
];

const INQUIRY_TYPES = [
  { id: 'general', label: 'General' },
  { id: 'order', label: 'Order Issue' },
  { id: 'payment', label: 'Payment' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'refund', label: 'Refund' },
];

export default function ContactUsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleContactOption = (option: ContactOption) => {
    switch (option.action) {
      case 'phone':
        Linking.openURL(`tel:${option.value}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${option.value}?subject=Support Request`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${option.value.replace('+', '')}`);
        break;
      case 'chat':
        (navigation as any).navigate('LiveChat');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      Alert.alert(
        'Message Sent!',
        'We\'ll get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
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
        <Text style={[styles.pageTitle, { color: colors.text }]}>Contact Us</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>We're here to help you</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Contact Options Grid */}
          <View style={styles.contactGrid}>
            {CONTACT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.contactCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                activeOpacity={0.7}
                onPress={() => handleContactOption(option)}
              >
                <View style={[styles.contactIcon, { backgroundColor: isDark ? `${option.color}20` : option.bgColor }]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <Text style={[styles.contactTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.contactSubtitle, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]} numberOfLines={1}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Send Message Section */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Send us a message</Text>
          <View style={[styles.formCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
                <Ionicons name="person-outline" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Your full name"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
                <Ionicons name="mail-outline" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Inquiry Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Topic</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {INQUIRY_TYPES.map((type) => {
                  const isSelected = inquiryType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.chip,
                        { backgroundColor: isSelected ? '#16A34A' : isDark ? colors.background : '#F3F4F6' },
                      ]}
                      onPress={() => setInquiryType(type.id)}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280' }
                      ]}>{type.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Message</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Describe your issue or question..."
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { opacity: isSending ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isSending}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {isSending ? 'Sending...' : 'Send Message'}
              </Text>
              {!isSending && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>

          {/* Office Info */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Visit our office</Text>
          <View style={[styles.officeCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.officeRow}>
              <View style={[styles.officeIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                <Ionicons name="location" size={20} color="#F59E0B" />
              </View>
              <View style={styles.officeContent}>
                <Text style={[styles.officeTitle, { color: colors.text }]}>Handwork HQ</Text>
                <Text style={[styles.officeText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>123 Farm Street, Victoria Island, Lagos</Text>
              </View>
            </View>
            <View style={[styles.officeDivider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />
            <View style={styles.officeRow}>
              <View style={[styles.officeIcon, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7' }]}>
                <Ionicons name="time-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.officeContent}>
                <Text style={[styles.officeTitle, { color: colors.text }]}>Business Hours</Text>
                <Text style={[styles.officeText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Mon-Fri: 8AM-6PM • Sat: 9AM-4PM</Text>
              </View>
            </View>
          </View>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  contactCard: {
    width: '47%',
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
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    fontFamily: FONTS.regular,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 100,
    width: '100%',
    fontFamily: FONTS.regular,
  },
  chipScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipSelected: {
    backgroundColor: '#16A34A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  officeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  officeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  officeContent: {
    flex: 1,
  },
  officeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  officeText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  officeDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
    marginLeft: 52,
  },
});

/**
 * AI Chatbot Screen
 * Interactive AI-powered support chatbot
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, SPACING } from '../../constants/theme';
import chatbotService, { ChatbotMessage, ChatbotConversation } from '../../services/chatbotService';
import { useAppSelector } from '../../store';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestedActions?: string[];
  isTyping?: boolean;
}

const QUICK_QUESTIONS = [
  { id: '1', text: '📦 Track my order', query: 'I want to track my order' },
  { id: '2', text: '💰 Refund request', query: 'How do I request a refund?' },
  { id: '3', text: '🚚 Delivery status', query: 'Where is my delivery?' },
  { id: '4', text: '💳 Payment issue', query: 'I have a payment problem' },
  { id: '5', text: '👨‍🌾 Become a farmer', query: 'How do I become a farmer vendor?' },
  { id: '6', text: '🚴 Become a rider', query: 'How do I become a delivery rider?' },
];

export default function AIChatbotScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  const { isAuthenticated } = useAppSelector(state => state.auth);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // Animation for typing indicator
  const typingDots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (isSending) {
      const animations = typingDots.map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 150),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        )
      );
      Animated.parallel(animations).start();
    } else {
      typingDots.forEach(dot => dot.setValue(0));
    }
  }, [isSending]);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "Hi! 👋 I'm your Handwork AI assistant. I can help you with orders, deliveries, payments, and more. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        suggestedActions: ['Track Order', 'Get Refund', 'Contact Support'],
      };
      setMessages([welcomeMessage]);

      if (isAuthenticated) {
        try {
          // Try to get active conversation
          const activeConversation = await chatbotService.getActiveConversation();
          if (activeConversation) {
            setConversationId(activeConversation.id);
            // Load existing messages
            const existingMessages: Message[] = activeConversation.messages.map((msg, index) => ({
              id: `msg-${index}`,
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'bot',
              timestamp: new Date(msg.timestamp),
              suggestedActions: msg.suggestedActions,
            }));
            if (existingMessages.length > 0) {
              setMessages([welcomeMessage, ...existingMessages]);
              setShowQuickQuestions(false);
            }
          }
        } catch (error) {
          console.log('No active conversation');
        }
      }
      
      setIsLoading(false);
    };

    initChat();
  }, [isAuthenticated]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isSending) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to chat with our AI assistant.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login' as any) },
        ]
      );
      return;
    }

    setInputText('');
    setShowQuickQuestions(false);
    setIsSending(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    try {
      const response = await chatbotService.sendMessage(messageText, conversationId || undefined);
      
      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        suggestedActions: response.suggestedActions,
      };
      setMessages(prev => [...prev, botMessage]);

      // Check if escalation is needed
      if (response.shouldEscalate) {
        Alert.alert(
          'Connect with Support',
          response.escalationReason || 'Would you like to speak with a human support agent?',
          [
            { text: 'Continue with AI', style: 'cancel' },
            {
              text: 'Talk to Human',
              onPress: () => handleEscalate(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I couldn't process your message. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
        suggestedActions: ['Try Again', 'Contact Support'],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  const handleEscalate = async () => {
    if (conversationId) {
      try {
        await chatbotService.escalateToSupport(conversationId, 'User requested human support');
      } catch (error) {
        console.error('Escalation error:', error);
      }
    }
    navigation.navigate('LiveChat' as any, {
      subject: 'Escalated from AI Chat',
      category: 'other',
    });
  };

  const handleQuickQuestion = (query: string) => {
    handleSend(query);
  };

  const handleSuggestedAction = (action: string) => {
    if (action === 'Contact Support' || action === 'Talk to Human') {
      handleEscalate();
    } else if (action === 'Try Again') {
      inputRef.current?.focus();
    } else {
      handleSend(action);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === 'bot';

    return (
      <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
        {isBot && (
          <View style={[styles.avatarContainer, { backgroundColor: '#16A34A' }]}>
            <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isBot
              ? [styles.botBubble, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]
              : [styles.userBubble, { backgroundColor: '#16A34A' }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isBot ? colors.text : '#FFFFFF' },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: isBot ? colors.textSecondary : 'rgba(255,255,255,0.7)' },
            ]}
          >
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Suggested Actions */}
        {isBot && item.suggestedActions && item.suggestedActions.length > 0 && (
          <View style={styles.suggestedActionsContainer}>
            {item.suggestedActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => handleSuggestedAction(action)}
              >
                <Text style={[styles.actionText, { color: '#16A34A' }]}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isSending) return null;

    return (
      <View style={[styles.messageRow, styles.botRow]}>
        <View style={[styles.avatarContainer, { backgroundColor: '#16A34A' }]}>
          <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
        </View>
        <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
          {typingDots.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.typingDot,
                {
                  backgroundColor: colors.textSecondary,
                  transform: [
                    {
                      translateY: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#16A34A', '#15803D']}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="robot-happy" size={28} color="#FFF" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Always online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={handleEscalate}>
          <Ionicons name="person" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Starting AI assistant...
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderTypingIndicator}
              onContentSizeChange={scrollToBottom}
            />

            {/* Quick Questions */}
            {showQuickQuestions && (
              <View style={[styles.quickQuestionsContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.quickQuestionsTitle, { color: colors.textSecondary }]}>
                  Quick Questions
                </Text>
                <View style={styles.quickQuestionsGrid}>
                  {QUICK_QUESTIONS.map(q => (
                    <TouchableOpacity
                      key={q.id}
                      style={[styles.quickQuestionButton, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                      onPress={() => handleQuickQuestion(q.query)}
                    >
                      <Text style={[styles.quickQuestionText, { color: colors.text }]}>{q.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Input Area */}
            <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderTopColor: colors.border }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text, backgroundColor: isDark ? colors.background : '#F3F4F6' }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() && !isSending ? '#16A34A' : colors.border },
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isSending}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Bottom safe area */}
      <View style={[styles.bottomSafe, { height: insets.bottom, backgroundColor: isDark ? colors.card : '#FFFFFF' }]} />
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  botRow: {
    alignSelf: 'flex-start',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
    textAlign: 'right',
  },
  suggestedActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  quickQuestionsTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 10,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickQuestionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickQuestionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bottomSafe: {
    width: '100%',
  },
});

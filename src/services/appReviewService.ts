import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform, Alert, Linking } from 'react-native';

const STORAGE_KEYS = {
  LAST_REVIEW_PROMPT: '@app_review_last_prompt',
  REVIEW_PROMPT_COUNT: '@app_review_prompt_count',
  HAS_REVIEWED: '@app_has_reviewed',
  POSITIVE_EXPERIENCES: '@app_positive_experiences',
};

// Configuration
const CONFIG = {
  // Number of positive experiences before first prompt
  EXPERIENCES_BEFORE_FIRST_PROMPT: 3,
  // Number of positive experiences for subsequent prompts
  EXPERIENCES_BEFORE_REPEAT_PROMPT: 5,
  // Minimum days between prompts
  MIN_DAYS_BETWEEN_PROMPTS: 30,
  // Maximum number of times to prompt user
  MAX_PROMPT_COUNT: 3,
};

interface ReviewState {
  lastPromptDate: string | null;
  promptCount: number;
  hasReviewed: boolean;
  positiveExperiences: number;
}

/**
 * App Review Service
 * Tracks positive user experiences and prompts for App Store/Play Store reviews
 */
class AppReviewService {
  private state: ReviewState = {
    lastPromptDate: null,
    promptCount: 0,
    hasReviewed: false,
    positiveExperiences: 0,
  };

  private initialized = false;

  /**
   * Initialize the service by loading saved state
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [lastPrompt, promptCount, hasReviewed, experiences] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT),
        AsyncStorage.getItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_REVIEWED),
        AsyncStorage.getItem(STORAGE_KEYS.POSITIVE_EXPERIENCES),
      ]);

      this.state = {
        lastPromptDate: lastPrompt,
        promptCount: promptCount ? parseInt(promptCount, 10) : 0,
        hasReviewed: hasReviewed === 'true',
        positiveExperiences: experiences ? parseInt(experiences, 10) : 0,
      };

      this.initialized = true;
      console.log('[AppReviewService] Initialized with state:', this.state);
    } catch (error) {
      console.error('[AppReviewService] Failed to initialize:', error);
    }
  }

  /**
   * Record a positive experience
   */
  async recordPositiveExperience(type: 'order_delivered' | 'review_submitted' | 'referral_success' | 'milestone_reached'): Promise<void> {
    await this.initialize();

    this.state.positiveExperiences += 1;
    await AsyncStorage.setItem(
      STORAGE_KEYS.POSITIVE_EXPERIENCES,
      this.state.positiveExperiences.toString()
    );

    console.log(`[AppReviewService] Recorded positive experience: ${type}, total: ${this.state.positiveExperiences}`);

    // Check if we should prompt for review
    await this.checkAndPromptForReview();
  }

  /**
   * Check conditions and potentially prompt for review
   */
  async checkAndPromptForReview(): Promise<boolean> {
    await this.initialize();

    // Don't prompt if user has already reviewed
    if (this.state.hasReviewed) {
      console.log('[AppReviewService] User has already reviewed, skipping');
      return false;
    }

    // Don't prompt if we've reached max prompt count
    if (this.state.promptCount >= CONFIG.MAX_PROMPT_COUNT) {
      console.log('[AppReviewService] Max prompt count reached, skipping');
      return false;
    }

    // Check if enough time has passed since last prompt
    if (this.state.lastPromptDate) {
      const lastPrompt = new Date(this.state.lastPromptDate);
      const daysSinceLastPrompt = Math.floor(
        (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPrompt < CONFIG.MIN_DAYS_BETWEEN_PROMPTS) {
        console.log(`[AppReviewService] Only ${daysSinceLastPrompt} days since last prompt, need ${CONFIG.MIN_DAYS_BETWEEN_PROMPTS}`);
        return false;
      }
    }

    // Check if enough positive experiences
    const requiredExperiences = this.state.promptCount === 0
      ? CONFIG.EXPERIENCES_BEFORE_FIRST_PROMPT
      : CONFIG.EXPERIENCES_BEFORE_REPEAT_PROMPT;

    if (this.state.positiveExperiences < requiredExperiences) {
      console.log(`[AppReviewService] Only ${this.state.positiveExperiences} experiences, need ${requiredExperiences}`);
      return false;
    }

    // All conditions met, prompt for review
    console.log('[AppReviewService] Prompting for review');
    return this.promptForReview();
  }

  /**
   * Show the review prompt
   */
  async promptForReview(): Promise<boolean> {
    try {
      // Check if store review is available
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        // Use native in-app review
        await StoreReview.requestReview();
        await this.recordPromptShown();
        return true;
      } else {
        // Fall back to manual prompt with deep link
        return this.showManualReviewPrompt();
      }
    } catch (error) {
      console.error('[AppReviewService] Failed to prompt for review:', error);
      return this.showManualReviewPrompt();
    }
  }

  /**
   * Show manual review prompt with store deep link
   */
  private showManualReviewPrompt(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🌟 Enjoying Handwork?',
        'Your feedback helps local farmers reach more customers. Would you mind taking a moment to rate us?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: async () => {
              await this.recordPromptShown();
              resolve(false);
            },
          },
          {
            text: 'Never Ask Again',
            onPress: async () => {
              await this.markAsReviewed();
              resolve(false);
            },
          },
          {
            text: 'Rate App',
            onPress: async () => {
              await this.openStoreForReview();
              await this.markAsReviewed();
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Open the app store for review
   */
  async openStoreForReview(): Promise<void> {
    try {
      // Check if we can use StoreReview
      const hasAction = await StoreReview.hasAction();
      if (hasAction) {
        await StoreReview.requestReview();
        return;
      }

      // Fall back to store URL
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/id{YOUR_APP_ID}?action=write-review',
        android: 'market://details?id={YOUR_PACKAGE_NAME}',
        default: 'https://handwork.com',
      });

      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
      console.error('[AppReviewService] Failed to open store:', error);
    }
  }

  /**
   * Record that a prompt was shown
   */
  private async recordPromptShown(): Promise<void> {
    this.state.promptCount += 1;
    this.state.lastPromptDate = new Date().toISOString();
    this.state.positiveExperiences = 0; // Reset counter

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT, this.state.promptCount.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_REVIEW_PROMPT, this.state.lastPromptDate),
      AsyncStorage.setItem(STORAGE_KEYS.POSITIVE_EXPERIENCES, '0'),
    ]);

    console.log('[AppReviewService] Recorded prompt shown, count:', this.state.promptCount);
  }

  /**
   * Mark user as having reviewed (or opted out)
   */
  async markAsReviewed(): Promise<void> {
    this.state.hasReviewed = true;
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_REVIEWED, 'true');
    console.log('[AppReviewService] Marked as reviewed');
  }

  /**
   * Get current state (for debugging)
   */
  async getState(): Promise<ReviewState> {
    await this.initialize();
    return { ...this.state };
  }

  /**
   * Reset all state (for testing)
   */
  async reset(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_REVIEW_PROMPT),
      AsyncStorage.removeItem(STORAGE_KEYS.REVIEW_PROMPT_COUNT),
      AsyncStorage.removeItem(STORAGE_KEYS.HAS_REVIEWED),
      AsyncStorage.removeItem(STORAGE_KEYS.POSITIVE_EXPERIENCES),
    ]);
    this.state = {
      lastPromptDate: null,
      promptCount: 0,
      hasReviewed: false,
      positiveExperiences: 0,
    };
    this.initialized = false;
    console.log('[AppReviewService] Reset complete');
  }
}

export const appReviewService = new AppReviewService();

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const FEATURE_FLAGS_KEY = '@feature_flags';
const EXPERIMENTS_KEY = '@experiments';
const USER_BUCKET_KEY = '@user_bucket';

// Feature flag definitions
export type FeatureFlag = 
  | 'new_checkout_flow'
  | 'social_features'
  | 'video_stories'
  | 'premium_subscription'
  | 'group_buying'
  | 'live_streaming'
  | 'ai_chatbot'
  | 'price_alerts'
  | 'subscription_boxes'
  | 'dark_mode'
  | 'biometric_auth'
  | 'voice_search'
  | 'ar_product_preview'
  | 'offline_mode';

// Experiment definitions
export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights: number[]; // Must sum to 100
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  assignedAt: string;
}

// Default feature flags (production defaults)
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  new_checkout_flow: false,
  social_features: true,
  video_stories: false,
  premium_subscription: false,
  group_buying: true,
  live_streaming: true,
  ai_chatbot: true,
  price_alerts: true,
  subscription_boxes: true,
  dark_mode: true,
  biometric_auth: true,
  voice_search: false,
  ar_product_preview: false,
  offline_mode: true,
};

class FeatureFlagsService {
  private flags: Record<FeatureFlag, boolean> = { ...DEFAULT_FLAGS };
  private experiments: Map<string, ExperimentAssignment> = new Map();
  private userBucket: number = 0;
  private initialized = false;
  private userId: string | null = null;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized && this.userId === userId) return;

    this.userId = userId || null;

    try {
      // Generate or retrieve user bucket (0-99)
      await this.initializeUserBucket();

      // Load cached flags and experiments
      await this.loadCachedData();

      // Fetch remote flags (non-blocking)
      this.fetchRemoteFlags().catch(console.error);

      this.initialized = true;
    } catch (error) {
      console.error('FeatureFlagsService initialization error:', error);
    }
  }

  private async initializeUserBucket(): Promise<void> {
    let bucket = await AsyncStorage.getItem(USER_BUCKET_KEY);
    if (!bucket) {
      // Assign random bucket for A/B testing
      const randomBucket = Math.floor(Math.random() * 100);
      await AsyncStorage.setItem(USER_BUCKET_KEY, String(randomBucket));
      this.userBucket = randomBucket;
    } else {
      this.userBucket = parseInt(bucket, 10);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const [flagsJson, experimentsJson] = await Promise.all([
        AsyncStorage.getItem(FEATURE_FLAGS_KEY),
        AsyncStorage.getItem(EXPERIMENTS_KEY),
      ]);

      if (flagsJson) {
        const cachedFlags = JSON.parse(flagsJson);
        this.flags = { ...DEFAULT_FLAGS, ...cachedFlags };
      }

      if (experimentsJson) {
        const cachedExperiments: ExperimentAssignment[] = JSON.parse(experimentsJson);
        cachedExperiments.forEach(exp => {
          this.experiments.set(exp.experimentId, exp);
        });
      }
    } catch (error) {
      console.error('Error loading cached feature flags:', error);
    }
  }

  private async fetchRemoteFlags(): Promise<void> {
    try {
      const response = await apiClient.get<{ flags?: Record<string, boolean>; experiments?: Experiment[] }>('/config/feature-flags', {
        params: { userId: this.userId, bucket: this.userBucket },
      });

      const data = response as any;
      if (data?.flags) {
        this.flags = { ...DEFAULT_FLAGS, ...data.flags };
        await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(this.flags));
      }

      if (data?.experiments) {
        await this.processExperiments(data.experiments);
      }
    } catch (error) {
      // Use cached/default flags on error
      console.warn('Could not fetch remote feature flags:', error);
    }
  }

  private async processExperiments(experiments: Experiment[]): Promise<void> {
    for (const experiment of experiments) {
      if (!experiment.isActive) continue;

      // Check if user is already assigned to this experiment
      const existing = this.experiments.get(experiment.id);
      if (existing) continue;

      // Assign user to variant based on bucket
      const variant = this.assignVariant(experiment);
      const assignment: ExperimentAssignment = {
        experimentId: experiment.id,
        variant,
        assignedAt: new Date().toISOString(),
      };

      this.experiments.set(experiment.id, assignment);
    }

    // Save experiment assignments
    const experimentsArray = Array.from(this.experiments.values());
    await AsyncStorage.setItem(EXPERIMENTS_KEY, JSON.stringify(experimentsArray));
  }

  private assignVariant(experiment: Experiment): string {
    const { variants, weights } = experiment;
    
    // Calculate cumulative weights
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (this.userBucket < cumulative) {
        return variants[i];
      }
    }
    
    return variants[0]; // Fallback to first variant
  }

  // Check if a feature is enabled
  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] ?? DEFAULT_FLAGS[flag] ?? false;
  }

  // Get variant for an experiment
  getExperimentVariant(experimentId: string): string | null {
    const assignment = this.experiments.get(experimentId);
    return assignment?.variant || null;
  }

  // Check if user is in a specific variant
  isInVariant(experimentId: string, variant: string): boolean {
    const assignment = this.experiments.get(experimentId);
    return assignment?.variant === variant;
  }

  // Get user's bucket (for debugging)
  getUserBucket(): number {
    return this.userBucket;
  }

  // Force refresh flags from server
  async refresh(): Promise<void> {
    await this.fetchRemoteFlags();
  }

  // Override flag locally (for testing)
  setFlagOverride(flag: FeatureFlag, enabled: boolean): void {
    if (__DEV__) {
      this.flags[flag] = enabled;
    }
  }

  // Get all current flags (for debugging)
  getAllFlags(): Record<FeatureFlag, boolean> {
    return { ...this.flags };
  }

  // Get all experiment assignments
  getAllExperiments(): ExperimentAssignment[] {
    return Array.from(this.experiments.values());
  }
}

export const featureFlags = new FeatureFlagsService();

// React hook for using feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(flag));

  useEffect(() => {
    // Re-check on mount in case flags were updated
    setEnabled(featureFlags.isEnabled(flag));
  }, [flag]);

  return enabled;
}

export function useExperiment(experimentId: string): string | null {
  const [variant, setVariant] = useState<string | null>(() => 
    featureFlags.getExperimentVariant(experimentId)
  );

  useEffect(() => {
    setVariant(featureFlags.getExperimentVariant(experimentId));
  }, [experimentId]);

  return variant;
}

export default featureFlags;

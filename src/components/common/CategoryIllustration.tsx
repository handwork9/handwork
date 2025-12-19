import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import all illustrations
import VegetablesIllustration from '../../assets/illustrations/categories/VegetablesIllustration';
import FruitsIllustration from '../../assets/illustrations/categories/FruitsIllustration';
import GrainsIllustration from '../../assets/illustrations/categories/GrainsIllustration';
import DairyIllustration from '../../assets/illustrations/categories/DairyIllustration';
import EggsIllustration from '../../assets/illustrations/categories/EggsIllustration';
import MeatIllustration from '../../assets/illustrations/categories/MeatIllustration';
import PoultryIllustration from '../../assets/illustrations/categories/PoultryIllustration';
import SeafoodIllustration from '../../assets/illustrations/categories/SeafoodIllustration';
import HerbsSpicesIllustration from '../../assets/illustrations/categories/HerbsSpicesIllustration';
import HoneyIllustration from '../../assets/illustrations/categories/HoneyIllustration';
import NutsSeedsIllustration from '../../assets/illustrations/categories/NutsSeedsIllustration';
import TubersIllustration from '../../assets/illustrations/categories/TubersIllustration';
import OilsIllustration from '../../assets/illustrations/categories/OilsIllustration';
import BeveragesIllustration from '../../assets/illustrations/categories/BeveragesIllustration';
import LivestockIllustration from '../../assets/illustrations/categories/LivestockIllustration';
import OthersIllustration from '../../assets/illustrations/categories/OthersIllustration';

// Map category IDs to their illustration components
const ILLUSTRATION_MAP: Record<string, React.FC<{ width?: number; height?: number; color?: string }>> = {
  vegetables: VegetablesIllustration,
  fruits: FruitsIllustration,
  grains: GrainsIllustration,
  legumes: GrainsIllustration,
  dairy: DairyIllustration,
  eggs: EggsIllustration,
  meat: MeatIllustration,
  poultry: PoultryIllustration,
  seafood: SeafoodIllustration,
  herbs_spices: HerbsSpicesIllustration,
  herbs: HerbsSpicesIllustration,
  spices: HerbsSpicesIllustration,
  honey: HoneyIllustration,
  honey_bee_products: HoneyIllustration,
  nuts_seeds: NutsSeedsIllustration,
  nuts: NutsSeedsIllustration,
  seeds: NutsSeedsIllustration,
  tubers: TubersIllustration,
  tubers_roots: TubersIllustration,
  roots: TubersIllustration,
  oils: OilsIllustration,
  oils_fats: OilsIllustration,
  beverages: BeveragesIllustration,
  drinks: BeveragesIllustration,
  livestock: LivestockIllustration,
  animals: LivestockIllustration,
  processed: OthersIllustration,
  'processed-foods': OthersIllustration,
  others: OthersIllustration,
  other: OthersIllustration,
  miscellaneous: OthersIllustration,
};

// Fallback icon configuration
const FALLBACK_ICONS: Record<string, { name: string; type: 'ionicons' | 'material' }> = {
  vegetables: { name: 'sprout', type: 'material' },
  fruits: { name: 'fruit-cherries', type: 'material' },
  grains: { name: 'barley', type: 'material' },
  legumes: { name: 'seed', type: 'material' },
  dairy: { name: 'cup', type: 'material' },
  eggs: { name: 'egg-outline', type: 'material' },
  meat: { name: 'food-steak', type: 'material' },
  poultry: { name: 'turkey', type: 'material' },
  seafood: { name: 'fish', type: 'material' },
  herbs_spices: { name: 'leaf', type: 'material' },
  honey: { name: 'beehive-outline', type: 'material' },
  nuts_seeds: { name: 'peanut', type: 'material' },
  tubers: { name: 'food-apple', type: 'material' },
  oils: { name: 'oil', type: 'material' },
  beverages: { name: 'cup-water', type: 'material' },
  livestock: { name: 'cow', type: 'material' },
  processed: { name: 'package-variant', type: 'material' },
  others: { name: 'basket', type: 'material' },
};

interface CategoryIllustrationProps {
  categoryId: string;
  size?: number;
  color?: string;
  useIllustration?: boolean;
  fallbackIcon?: string;
  fallbackIconType?: 'ionicons' | 'material';
  containerStyle?: object;
}

const CategoryIllustration: React.FC<CategoryIllustrationProps> = ({
  categoryId,
  size = 64,
  color,
  useIllustration = true,
  fallbackIcon,
  fallbackIconType = 'material',
  containerStyle,
}) => {
  // Normalize category ID
  const normalizedId = categoryId.toLowerCase().replace(/[\s-]/g, '_');
  
  // Try to get the illustration component
  const IllustrationComponent = useIllustration ? ILLUSTRATION_MAP[normalizedId] : null;
  
  if (IllustrationComponent) {
    return (
      <View style={[styles.container, containerStyle]}>
        <IllustrationComponent width={size} height={size} color={color} />
      </View>
    );
  }
  
  // Fallback to icon
  const fallback = FALLBACK_ICONS[normalizedId];
  const iconName = fallbackIcon || fallback?.name || 'help-circle';
  const iconType = fallbackIconType || fallback?.type || 'material';
  
  return (
    <View style={[styles.container, containerStyle]}>
      {iconType === 'material' ? (
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={size * 0.6} 
          color={color || '#666'} 
        />
      ) : (
        <Ionicons 
          name={iconName as any} 
          size={size * 0.6} 
          color={color || '#666'} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryIllustration;

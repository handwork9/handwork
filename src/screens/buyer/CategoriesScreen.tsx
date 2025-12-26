import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { CategoryIllustration, SubcategoryIllustration } from '../../components/common';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 105;
const GRID_WIDTH = width - SIDEBAR_WIDTH;
const CARD_WIDTH = (GRID_WIDTH - 40) / 3;

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
}

interface MainCategory {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  color: string;
  subcategories: SubCategory[];
}

const CATEGORIES_DATA: MainCategory[] = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    icon: 'sprout',
    iconType: 'material',
    color: '#34C759',
    subcategories: [
      { id: 'leafy-greens', name: 'Leafy Greens', icon: 'leaf', iconType: 'material' },
      { id: 'ugwu', name: 'Ugwu (Pumpkin Leaf)', icon: 'leaf', iconType: 'material' },
      { id: 'ewedu', name: 'Ewedu', icon: 'leaf', iconType: 'material' },
      { id: 'waterleaf', name: 'Waterleaf', icon: 'leaf', iconType: 'material' },
      { id: 'bitter-leaf', name: 'Bitter Leaf', icon: 'leaf-circle-outline', iconType: 'material' },
      { id: 'peppers', name: 'Peppers', icon: 'chili-hot', iconType: 'material' },
      { id: 'tomatoes', name: 'Tomatoes', icon: 'food-apple', iconType: 'material' },
      { id: 'onions', name: 'Onions & Garlic', icon: 'circle-outline', iconType: 'material' },
      { id: 'okra', name: 'Okra', icon: 'food-variant', iconType: 'material' },
      { id: 'garden-egg', name: 'Garden Egg', icon: 'food-apple-outline', iconType: 'material' },
      { id: 'cucumber', name: 'Cucumber', icon: 'food-variant', iconType: 'material' },
      { id: 'cabbage', name: 'Cabbage', icon: 'leaf-circle', iconType: 'material' },
      { id: 'carrots', name: 'Carrots', icon: 'carrot', iconType: 'material' },
    ],
  },
  {
    id: 'fruits',
    name: 'Fruits',
    icon: 'fruit-cherries',
    iconType: 'material',
    color: '#FF9500',
    subcategories: [
      { id: 'pawpaw', name: 'Pawpaw', icon: 'fruit-pineapple', iconType: 'material' },
      { id: 'mango', name: 'Mango', icon: 'fruit-cherries', iconType: 'material' },
      { id: 'pineapple', name: 'Pineapple', icon: 'fruit-pineapple', iconType: 'material' },
      { id: 'bananas', name: 'Bananas & Plantains', icon: 'food-banana', iconType: 'material' },
      { id: 'watermelon', name: 'Watermelon', icon: 'fruit-watermelon', iconType: 'material' },
      { id: 'oranges', name: 'Oranges', icon: 'fruit-citrus', iconType: 'material' },
      { id: 'guava', name: 'Guava', icon: 'fruit-cherries', iconType: 'material' },
      { id: 'avocado', name: 'Avocado', icon: 'avocado', iconType: 'material' },
      { id: 'soursop', name: 'Soursop', icon: 'fruit-cherries', iconType: 'material' },
      { id: 'coconut-fruit', name: 'Coconut', icon: 'circle', iconType: 'material' },
      { id: 'apple', name: 'Apple', icon: 'food-apple', iconType: 'material' },
      { id: 'grapes', name: 'Grapes', icon: 'fruit-grapes', iconType: 'material' },
    ],
  },
  {
    id: 'grains',
    name: 'Grains',
    icon: 'barley',
    iconType: 'material',
    color: '#8B4513',
    subcategories: [
      { id: 'rice', name: 'Rice', icon: 'rice', iconType: 'material' },
      { id: 'beans', name: 'Beans', icon: 'seed', iconType: 'material' },
      { id: 'maize', name: 'Maize & Corn', icon: 'corn', iconType: 'material' },
      { id: 'millet', name: 'Millet', icon: 'grain', iconType: 'material' },
      { id: 'sorghum', name: 'Sorghum', icon: 'barley', iconType: 'material' },
      { id: 'guinea-corn', name: 'Guinea Corn', icon: 'corn', iconType: 'material' },
      { id: 'acha', name: 'Acha/Fonio', icon: 'grain', iconType: 'material' },
      { id: 'wheat', name: 'Wheat', icon: 'barley', iconType: 'material' },
      { id: 'oats', name: 'Oats', icon: 'barley', iconType: 'material' },
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy',
    icon: 'cup',
    iconType: 'material',
    color: '#007AFF',
    subcategories: [
      { id: 'milk', name: 'Fresh Milk', icon: 'cup', iconType: 'material' },
      { id: 'wara', name: 'Wara (Local Cheese)', icon: 'cheese', iconType: 'material' },
      { id: 'cheese', name: 'Cheese', icon: 'cheese', iconType: 'material' },
      { id: 'yogurt', name: 'Yogurt', icon: 'cup', iconType: 'material' },
      { id: 'fura', name: 'Fura', icon: 'circle', iconType: 'material' },
      { id: 'nono', name: 'Nono', icon: 'cup-water', iconType: 'material' },
      { id: 'butter', name: 'Butter', icon: 'cube-outline', iconType: 'material' },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: 'egg',
    iconType: 'material',
    color: '#FFCC00',
    subcategories: [
      { id: 'chicken-eggs', name: 'Chicken Eggs', icon: 'egg', iconType: 'material' },
      { id: 'duck-eggs', name: 'Duck Eggs', icon: 'egg-outline', iconType: 'material' },
      { id: 'quail-eggs', name: 'Quail Eggs', icon: 'egg', iconType: 'material' },
      { id: 'organic-eggs', name: 'Organic Eggs', icon: 'egg-easter', iconType: 'material' },
    ],
  },
  {
    id: 'meat',
    name: 'Meat',
    icon: 'food-steak',
    iconType: 'material',
    color: '#FF3B30',
    subcategories: [
      { id: 'beef', name: 'Beef', icon: 'food-steak', iconType: 'material' },
      { id: 'goat', name: 'Goat Meat', icon: 'food-drumstick', iconType: 'material' },
      { id: 'lamb', name: 'Lamb', icon: 'food-drumstick-outline', iconType: 'material' },
      { id: 'pork', name: 'Pork', icon: 'pig-variant', iconType: 'material' },
      { id: 'bush-meat', name: 'Bush Meat', icon: 'food-steak', iconType: 'material' },
      { id: 'snail', name: 'Snail', icon: 'snail', iconType: 'material' },
      { id: 'processed', name: 'Processed Meat', icon: 'food-hot-dog', iconType: 'material' },
    ],
  },
  {
    id: 'poultry',
    name: 'Poultry',
    icon: 'turkey',
    iconType: 'material',
    color: '#FF2D55',
    subcategories: [
      { id: 'chicken', name: 'Chicken', icon: 'food-drumstick', iconType: 'material' },
      { id: 'turkey', name: 'Turkey', icon: 'turkey', iconType: 'material' },
      { id: 'duck', name: 'Duck', icon: 'duck', iconType: 'material' },
      { id: 'guinea-fowl', name: 'Guinea Fowl', icon: 'bird', iconType: 'material' },
    ],
  },
  {
    id: 'seafood',
    name: 'Seafood',
    icon: 'fish',
    iconType: 'material',
    color: '#5AC8FA',
    subcategories: [
      { id: 'fresh-fish', name: 'Fresh Fish', icon: 'fish', iconType: 'material' },
      { id: 'catfish', name: 'Catfish', icon: 'fish', iconType: 'material' },
      { id: 'tilapia', name: 'Tilapia', icon: 'fish', iconType: 'material' },
      { id: 'croaker', name: 'Croaker', icon: 'fish', iconType: 'material' },
      { id: 'dried-fish', name: 'Dried Fish', icon: 'fish', iconType: 'material' },
      { id: 'smoked-fish', name: 'Smoked Fish', icon: 'fish', iconType: 'material' },
      { id: 'stockfish', name: 'Stockfish', icon: 'fish', iconType: 'material' },
      { id: 'shrimp', name: 'Shrimp & Prawns', icon: 'shrimp', iconType: 'material' },
      { id: 'crayfish', name: 'Crayfish', icon: 'shrimp', iconType: 'material' },
      { id: 'periwinkle', name: 'Periwinkle', icon: 'snail', iconType: 'material' },
    ],
  },
  {
    id: 'herbs_spices',
    name: 'Herbs & Spices',
    icon: 'chili-mild',
    iconType: 'material',
    color: '#30B0C7',
    subcategories: [
      { id: 'fresh-herbs', name: 'Fresh Herbs', icon: 'leaf', iconType: 'material' },
      { id: 'uziza', name: 'Uziza', icon: 'leaf', iconType: 'material' },
      { id: 'scent-leaf', name: 'Scent Leaf', icon: 'leaf', iconType: 'material' },
      { id: 'curry-leaves', name: 'Curry Leaves', icon: 'leaf', iconType: 'material' },
      { id: 'thyme', name: 'Thyme', icon: 'leaf-circle-outline', iconType: 'material' },
      { id: 'dried-herbs', name: 'Dried Herbs', icon: 'leaf-off', iconType: 'material' },
      { id: 'spices', name: 'Spices', icon: 'chili-hot', iconType: 'material' },
      { id: 'cameroon-pepper', name: 'Cameroon Pepper', icon: 'chili-hot', iconType: 'material' },
      { id: 'cinnamon', name: 'Cinnamon', icon: 'leaf-circle-outline', iconType: 'material' },
      { id: 'locust-beans', name: 'Locust Beans (Iru)', icon: 'seed', iconType: 'material' },
    ],
  },
  {
    id: 'honey',
    name: 'Honey',
    icon: 'beehive-outline',
    iconType: 'material',
    color: '#FF9500',
    subcategories: [
      { id: 'raw-honey', name: 'Raw Honey', icon: 'beehive-outline', iconType: 'material' },
      { id: 'processed-honey', name: 'Processed Honey', icon: 'bee', iconType: 'material' },
      { id: 'honeycomb', name: 'Honeycomb', icon: 'hexagon-multiple', iconType: 'material' },
    ],
  },
  {
    id: 'nuts',
    name: 'Nuts',
    icon: 'peanut',
    iconType: 'material',
    color: '#8B4513',
    subcategories: [
      { id: 'groundnuts', name: 'Groundnuts', icon: 'peanut', iconType: 'material' },
      { id: 'cashew', name: 'Cashew Nuts', icon: 'peanut-outline', iconType: 'material' },
      { id: 'kolanut', name: 'Kolanut', icon: 'peanut', iconType: 'material' },
      { id: 'bitter-kola', name: 'Bitter Kola', icon: 'peanut', iconType: 'material' },
      { id: 'walnut', name: 'Walnut', icon: 'peanut-outline', iconType: 'material' },
      { id: 'coconut', name: 'Coconut', icon: 'circle', iconType: 'material' },
      { id: 'palm-nuts', name: 'Palm Nuts', icon: 'palm-tree', iconType: 'material' },
      { id: 'almond', name: 'Almond', icon: 'peanut-outline', iconType: 'material' },
    ],
  },
  {
    id: 'tubers',
    name: 'Tubers',
    icon: 'carrot',
    iconType: 'material',
    color: '#D2691E',
    subcategories: [
      { id: 'yam', name: 'Yam', icon: 'food-variant', iconType: 'material' },
      { id: 'cassava', name: 'Cassava', icon: 'carrot', iconType: 'material' },
      { id: 'potatoes', name: 'Irish Potatoes', icon: 'food-variant', iconType: 'material' },
      { id: 'sweet-potato', name: 'Sweet Potato', icon: 'carrot', iconType: 'material' },
      { id: 'cocoyam', name: 'Cocoyam', icon: 'food-variant', iconType: 'material' },
      { id: 'water-yam', name: 'Water Yam', icon: 'food-variant', iconType: 'material' },
    ],
  },
  {
    id: 'oils',
    name: 'Oils',
    icon: 'oil',
    iconType: 'material',
    color: '#DAA520',
    subcategories: [
      { id: 'palm-oil', name: 'Palm Oil', icon: 'oil', iconType: 'material' },
      { id: 'groundnut-oil', name: 'Groundnut Oil', icon: 'oil', iconType: 'material' },
      { id: 'coconut-oil', name: 'Coconut Oil', icon: 'oil', iconType: 'material' },
      { id: 'olive-oil', name: 'Olive Oil', icon: 'bottle-tonic', iconType: 'material' },
      { id: 'shea-butter', name: 'Shea Butter', icon: 'oil', iconType: 'material' },
      { id: 'vegetable-oil', name: 'Vegetable Oil', icon: 'bottle-tonic-outline', iconType: 'material' },
    ],
  },
  {
    id: 'legumes',
    name: 'Legumes',
    icon: 'seed',
    iconType: 'material',
    color: '#8B7355',
    subcategories: [
      { id: 'cowpeas', name: 'Cowpeas', icon: 'seed', iconType: 'material' },
      { id: 'soybeans', name: 'Soybeans', icon: 'seed-outline', iconType: 'material' },
      { id: 'pigeon-peas', name: 'Pigeon Peas', icon: 'seed', iconType: 'material' },
      { id: 'lentils', name: 'Lentils', icon: 'seed', iconType: 'material' },
      { id: 'black-eyed-peas', name: 'Black-eyed Peas', icon: 'seed-outline', iconType: 'material' },
      { id: 'beans', name: 'Beans (Ewa)', icon: 'seed', iconType: 'material' },
      { id: 'bambara-nuts', name: 'Bambara Nuts', icon: 'peanut', iconType: 'material' },
      { id: 'locust-beans', name: 'Locust Beans (Iru)', icon: 'seed', iconType: 'material' },
    ],
  },
  {
    id: 'processed',
    name: 'Processed',
    icon: 'food-variant',
    iconType: 'material',
    color: '#CD853F',
    subcategories: [
      { id: 'garri', name: 'Garri', icon: 'bowl', iconType: 'material' },
      { id: 'fufu', name: 'Fufu', icon: 'bowl-mix', iconType: 'material' },
      { id: 'lafun', name: 'Lafun', icon: 'bowl', iconType: 'material' },
      { id: 'elubo', name: 'Elubo', icon: 'bowl', iconType: 'material' },
      { id: 'amala-mix', name: 'Amala Mix', icon: 'bowl-mix', iconType: 'material' },
      { id: 'semovita', name: 'Semovita', icon: 'sack', iconType: 'material' },
      { id: 'ogbono', name: 'Ogbono', icon: 'seed', iconType: 'material' },
      { id: 'egusi', name: 'Egusi', icon: 'seed-outline', iconType: 'material' },
      { id: 'plantain-flour', name: 'Plantain Flour', icon: 'sack', iconType: 'material' },
      { id: 'yam-flour', name: 'Yam Flour', icon: 'sack', iconType: 'material' },
    ],
  },
  {
    id: 'livestock',
    name: 'Livestock',
    icon: 'cow',
    iconType: 'material',
    color: '#8B4513',
    subcategories: [
      { id: 'live-chicken', name: 'Live Chickens', icon: 'food-drumstick-outline', iconType: 'material' },
      { id: 'live-goats', name: 'Live Goats', icon: 'omega', iconType: 'material' },
      { id: 'live-cows', name: 'Live Cows', icon: 'cow', iconType: 'material' },
      { id: 'live-sheep', name: 'Live Sheep', icon: 'sheep', iconType: 'material' },
      { id: 'live-pigs', name: 'Live Pigs', icon: 'pig-variant', iconType: 'material' },
      { id: 'live-turkey', name: 'Live Turkeys', icon: 'turkey', iconType: 'material' },
      { id: 'live-ducks', name: 'Live Ducks', icon: 'duck', iconType: 'material' },
      { id: 'live-guinea-fowl', name: 'Guinea Fowl', icon: 'bird', iconType: 'material' },
      { id: 'live-rabbits', name: 'Live Rabbits', icon: 'rabbit', iconType: 'material' },
    ],
  },
  {
    id: 'seeds',
    name: 'Seeds',
    icon: 'seed-outline',
    iconType: 'material',
    color: '#6B8E23',
    subcategories: [
      { id: 'melon-seeds', name: 'Melon Seeds', icon: 'seed', iconType: 'material' },
      { id: 'sesame-seeds', name: 'Sesame Seeds', icon: 'seed-outline', iconType: 'material' },
      { id: 'pumpkin-seeds', name: 'Pumpkin Seeds', icon: 'seed', iconType: 'material' },
      { id: 'sunflower-seeds', name: 'Sunflower Seeds', icon: 'seed-outline', iconType: 'material' },
      { id: 'flax-seeds', name: 'Flax Seeds', icon: 'seed', iconType: 'material' },
      { id: 'chia-seeds', name: 'Chia Seeds', icon: 'seed-outline', iconType: 'material' },
      { id: 'ogiri', name: 'Ogiri', icon: 'seed', iconType: 'material' },
      { id: 'dawadawa', name: 'Dawadawa', icon: 'seed', iconType: 'material' },
    ],
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: 'cup-water',
    iconType: 'material',
    color: '#B22222',
    subcategories: [
      { id: 'palm-wine', name: 'Palm Wine', icon: 'glass-wine', iconType: 'material' },
      { id: 'zobo', name: 'Zobo Leaves', icon: 'leaf', iconType: 'material' },
      { id: 'kunu', name: 'Kunu', icon: 'cup', iconType: 'material' },
      { id: 'fura-da-nono', name: 'Fura da Nono', icon: 'cup-water', iconType: 'material' },
      { id: 'tiger-nuts', name: 'Tiger Nuts', icon: 'cup', iconType: 'material' },
      { id: 'ginger', name: 'Ginger', icon: 'food-variant', iconType: 'material' },
      { id: 'cocoa', name: 'Cocoa', icon: 'coffee', iconType: 'material' },
      { id: 'hibiscus', name: 'Hibiscus', icon: 'flower', iconType: 'material' },
    ],
  },
];

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>(CATEGORIES_DATA[0]);

  const handleSubcategoryPress = useCallback((subcategory: SubCategory) => {
    if (subcategory.id.startsWith('all-')) {
      (navigation as any).navigate('Search', { category: selectedCategory.id });
    } else {
      (navigation as any).navigate('Search', { 
        category: selectedCategory.id,
        subcategory: subcategory.id 
      });
    }
  }, [navigation, selectedCategory]);

  const renderSidebarItem = (category: MainCategory) => {
    const isSelected = selectedCategory.id === category.id;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.sidebarItem,
          isSelected && styles.sidebarItemSelected,
          { 
            backgroundColor: isSelected 
              ? (isDark ? colors.surface : '#FFFFFF') 
              : (isDark ? colors.card : 'transparent')
          },
        ]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
        )}
        <CategoryIllustration
          categoryId={category.id}
          size={48}
          color={isSelected ? category.color : (isDark ? category.color : undefined)}
        />
        <Text
          style={[
            styles.sidebarText,
            { color: isSelected ? (isDark ? colors.text : '#000000') : (isDark ? colors.text : '#333333') },
            isSelected && styles.sidebarTextSelected,
          ]}
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSubcategoryCard = ({ item }: { item: SubCategory }) => {
    const isSeeAll = item.id.startsWith('all-');
    
    return (
      <TouchableOpacity
        style={[
          styles.subcategoryCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
        ]}
        onPress={() => handleSubcategoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.subcategoryIconContainer,
          { 
            backgroundColor: isSeeAll 
              ? (isDark ? `${colors.primary}30` : `${colors.primary}15`)
              : (isDark ? `${selectedCategory.color}30` : `${selectedCategory.color}15`)
          }
        ]}>
          {isSeeAll ? (
            <Ionicons
              name="grid-outline"
              size={28}
              color={colors.primary}
            />
          ) : (
            <SubcategoryIllustration
              subcategoryId={item.id}
              size={40}
              color={isDark ? selectedCategory.color : selectedCategory.color}
              fallbackIcon={item.icon}
            />
          )}
        </View>
        <Text
          style={[
            styles.subcategoryName,
            { color: isSeeAll ? colors.primary : colors.text },
            isSeeAll && styles.seeAllText,
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          paddingTop: insets.top,
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => (navigation as any).navigate('Search')}
          >
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - Split View */}
      <View style={styles.content}>
        {/* Left Sidebar */}
        <View
          style={{ width: 105, maxWidth: 105, backgroundColor: isDark ? colors.card : '#F8F8F8' }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            {CATEGORIES_DATA.map(renderSidebarItem)}
          </ScrollView>
        </View>

        {/* Right Grid */}
        <View style={[
          styles.gridContainer,
          { backgroundColor: isDark ? colors.background : '#F2F2F7' }
        ]}>
          {/* See All Products Banner - TOP */}
          <TouchableOpacity
            style={[styles.seeAllBanner, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => (navigation as any).navigate('Search', { category: selectedCategory.id })}
            activeOpacity={0.8}
          >
            <Text style={[styles.seeAllBannerText, { color: colors.text }]}>See All Products</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Subcategories Card Container */}
          <View style={[styles.gridCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Category Header */}
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {selectedCategory.name}
              </Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('Search', { category: selectedCategory.id })}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Divider Line */}
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />

            {/* Subcategories Grid */}
            <FlatList
              data={selectedCategory.subcategories}
              keyExtractor={(item, index) => item?.id || `cat-${index}`}
              renderItem={renderSubcategoryCard}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.gridRow}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 50,
    backgroundColor: '#f0f0f0',
  },
  sidebarItem: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sidebarItemSelected: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  sidebarText: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  sidebarTextSelected: {
    fontFamily: FONTS.semiBold,
  },
  gridContainer: {
    flex: 1,
    padding: 8,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  viewAllText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  dividerLine: {
    height: 1,
    marginHorizontal: 12,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
    paddingTop: 4,
  },
  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  subcategoryCard: {
    width: CARD_WIDTH,
    margin: 4,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subcategoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  subcategoryName: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    lineHeight: 17,
    color: '#000000',
  },
  seeAllText: {
    fontFamily: FONTS.semiBold,
  },
  seeAllBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 45.3,
  },
  seeAllBannerText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#000000',
  },
});

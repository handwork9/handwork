import { ProductCategory } from '../types';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  color: string;
  emoji: string;
}

export interface SubcategoryInfo {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
}

export const PRODUCT_CATEGORIES: CategoryInfo[] = [
  { id: 'vegetables', name: 'Vegetables', icon: 'sprout', iconType: 'material', color: '#34C759', emoji: '🥬' },
  { id: 'fruits', name: 'Fruits', icon: 'fruit-cherries', iconType: 'material', color: '#FF9500', emoji: '🍎' },
  { id: 'grains', name: 'Grains', icon: 'barley', iconType: 'material', color: '#8E8E93', emoji: '🌾' },
  { id: 'dairy', name: 'Dairy', icon: 'cup', iconType: 'material', color: '#007AFF', emoji: '🥛' },
  { id: 'eggs', name: 'Eggs', icon: 'egg', iconType: 'material', color: '#FFCC00', emoji: '🥚' },
  { id: 'meat', name: 'Meat', icon: 'food-steak', iconType: 'material', color: '#FF3B30', emoji: '🥩' },
  { id: 'poultry', name: 'Poultry', icon: 'turkey', iconType: 'material', color: '#FF2D55', emoji: '🍗' },
  { id: 'seafood', name: 'Seafood', icon: 'fish', iconType: 'material', color: '#5AC8FA', emoji: '🐟' },
  { id: 'herbs_spices', name: 'Herbs & Spices', icon: 'chili-mild', iconType: 'material', color: '#30B0C7', emoji: '🌶️' },
  { id: 'honey', name: 'Honey', icon: 'beehive-outline', iconType: 'material', color: '#FFCC00', emoji: '🍯' },
  { id: 'nuts', name: 'Nuts', icon: 'peanut', iconType: 'material', color: '#8B4513', emoji: '🥜' },
  { id: 'tubers', name: 'Tubers', icon: 'carrot', iconType: 'material', color: '#D2691E', emoji: '🥔' },
  { id: 'oils', name: 'Oils', icon: 'oil', iconType: 'material', color: '#DAA520', emoji: '🫒' },
  { id: 'legumes', name: 'Legumes', icon: 'seed', iconType: 'material', color: '#8B7355', emoji: '🫘' },
  { id: 'processed', name: 'Processed', icon: 'food-variant', iconType: 'material', color: '#CD853F', emoji: '📦' },
  { id: 'livestock', name: 'Livestock', icon: 'cow', iconType: 'material', color: '#8B4513', emoji: '🐄' },
  { id: 'seeds', name: 'Seeds', icon: 'seed-outline', iconType: 'material', color: '#6B8E23', emoji: '🌱' },
  { id: 'beverages', name: 'Beverages', icon: 'cup-water', iconType: 'material', color: '#B22222', emoji: '🍹' },
  { id: 'others', name: 'Others', icon: 'package-variant', iconType: 'material', color: '#6B7280', emoji: '📦' },
];

// Map of category to subcategories
export const CATEGORY_SUBCATEGORIES: Record<ProductCategory, SubcategoryInfo[]> = {
  vegetables: [
    { id: 'leafy-greens', name: 'Leafy Greens', icon: 'leaf', iconType: 'material' },
    { id: 'ugwu', name: 'Ugwu (Pumpkin Leaf)', icon: 'leaf', iconType: 'material' },
    { id: 'ewedu', name: 'Ewedu', icon: 'leaf', iconType: 'material' },
    { id: 'waterleaf', name: 'Waterleaf', icon: 'leaf', iconType: 'material' },
    { id: 'bitter-leaf', name: 'Bitter Leaf', icon: 'leaf-circle-outline', iconType: 'material' },
    { id: 'tomatoes', name: 'Tomatoes', icon: 'food-apple', iconType: 'material' },
    { id: 'peppers', name: 'Peppers', icon: 'chili-hot', iconType: 'material' },
    { id: 'okra', name: 'Okra', icon: 'food-variant', iconType: 'material' },
    { id: 'onions', name: 'Onions', icon: 'circle-outline', iconType: 'material' },
    { id: 'garden-egg', name: 'Garden Egg', icon: 'food-apple-outline', iconType: 'material' },
    { id: 'cucumber', name: 'Cucumber', icon: 'food-variant', iconType: 'material' },
    { id: 'cabbage', name: 'Cabbage', icon: 'leaf-circle', iconType: 'material' },
    { id: 'carrots', name: 'Carrots', icon: 'carrot', iconType: 'material' },
  ],
  fruits: [
    { id: 'oranges', name: 'Oranges', icon: 'fruit-citrus', iconType: 'material' },
    { id: 'bananas', name: 'Bananas', icon: 'food-banana', iconType: 'material' },
    { id: 'plantain', name: 'Plantain', icon: 'food-banana', iconType: 'material' },
    { id: 'pawpaw', name: 'Pawpaw', icon: 'fruit-pineapple', iconType: 'material' },
    { id: 'mango', name: 'Mango', icon: 'fruit-cherries', iconType: 'material' },
    { id: 'pineapple', name: 'Pineapple', icon: 'fruit-pineapple', iconType: 'material' },
    { id: 'watermelon', name: 'Watermelon', icon: 'fruit-watermelon', iconType: 'material' },
    { id: 'guava', name: 'Guava', icon: 'fruit-cherries', iconType: 'material' },
    { id: 'avocado', name: 'Avocado', icon: 'avocado', iconType: 'material' },
    { id: 'soursop', name: 'Soursop', icon: 'fruit-cherries', iconType: 'material' },
    { id: 'apples', name: 'Apples', icon: 'food-apple', iconType: 'material' },
    { id: 'grapes', name: 'Grapes', icon: 'fruit-grapes', iconType: 'material' },
  ],
  grains: [
    { id: 'rice', name: 'Rice', icon: 'rice', iconType: 'material' },
    { id: 'maize', name: 'Maize (Corn)', icon: 'corn', iconType: 'material' },
    { id: 'wheat', name: 'Wheat', icon: 'barley', iconType: 'material' },
    { id: 'millet', name: 'Millet', icon: 'barley', iconType: 'material' },
    { id: 'sorghum', name: 'Sorghum', icon: 'grain', iconType: 'material' },
    { id: 'guinea-corn', name: 'Guinea Corn', icon: 'corn', iconType: 'material' },
    { id: 'acha-fonio', name: 'Acha (Fonio)', icon: 'grain', iconType: 'material' },
    { id: 'oats', name: 'Oats', icon: 'barley', iconType: 'material' },
    { id: 'barley', name: 'Barley', icon: 'barley', iconType: 'material' },
  ],
  dairy: [
    { id: 'fresh-milk', name: 'Fresh Milk', icon: 'cup', iconType: 'material' },
    { id: 'cheese', name: 'Cheese', icon: 'cheese', iconType: 'material' },
    { id: 'yogurt', name: 'Yogurt', icon: 'cup', iconType: 'material' },
    { id: 'butter', name: 'Butter', icon: 'cube-outline', iconType: 'material' },
    { id: 'cream', name: 'Cream', icon: 'cup-water', iconType: 'material' },
    { id: 'wara', name: 'Wara (Local Cheese)', icon: 'cheese', iconType: 'material' },
    { id: 'fura', name: 'Fura', icon: 'circle', iconType: 'material' },
    { id: 'nono', name: 'Nono', icon: 'cup', iconType: 'material' },
  ],
  eggs: [
    { id: 'chicken-eggs', name: 'Chicken Eggs', icon: 'egg', iconType: 'material' },
    { id: 'duck-eggs', name: 'Duck Eggs', icon: 'egg-outline', iconType: 'material' },
    { id: 'quail-eggs', name: 'Quail Eggs', icon: 'egg', iconType: 'material' },
    { id: 'turkey-eggs', name: 'Turkey Eggs', icon: 'egg-outline', iconType: 'material' },
    { id: 'organic-eggs', name: 'Organic Eggs', icon: 'egg-easter', iconType: 'material' },
  ],
  meat: [
    { id: 'beef', name: 'Beef', icon: 'food-steak', iconType: 'material' },
    { id: 'goat', name: 'Goat Meat', icon: 'food-drumstick', iconType: 'material' },
    { id: 'lamb', name: 'Lamb', icon: 'food-drumstick-outline', iconType: 'material' },
    { id: 'pork', name: 'Pork', icon: 'pig-variant', iconType: 'material' },
    { id: 'bush-meat', name: 'Bush Meat', icon: 'food-steak', iconType: 'material' },
    { id: 'snail', name: 'Snail', icon: 'snail', iconType: 'material' },
    { id: 'suya', name: 'Suya', icon: 'grill', iconType: 'material' },
  ],
  poultry: [
    { id: 'chicken', name: 'Chicken', icon: 'food-drumstick', iconType: 'material' },
    { id: 'turkey', name: 'Turkey', icon: 'turkey', iconType: 'material' },
    { id: 'duck', name: 'Duck', icon: 'duck', iconType: 'material' },
    { id: 'guinea-fowl', name: 'Guinea Fowl', icon: 'bird', iconType: 'material' },
  ],
  seafood: [
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
  herbs_spices: [
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
  honey: [
    { id: 'raw-honey', name: 'Raw Honey', icon: 'beehive-outline', iconType: 'material' },
    { id: 'processed-honey', name: 'Processed Honey', icon: 'bee', iconType: 'material' },
    { id: 'organic-honey', name: 'Organic Honey', icon: 'bee-flower', iconType: 'material' },
    { id: 'honeycomb', name: 'Honeycomb', icon: 'hexagon-multiple', iconType: 'material' },
    { id: 'bee-pollen', name: 'Bee Pollen', icon: 'bee', iconType: 'material' },
  ],
  nuts: [
    { id: 'groundnuts', name: 'Groundnuts', icon: 'peanut', iconType: 'material' },
    { id: 'cashews', name: 'Cashews', icon: 'peanut-outline', iconType: 'material' },
    { id: 'kolanut', name: 'Kolanut', icon: 'peanut', iconType: 'material' },
    { id: 'bitter-kola', name: 'Bitter Kola', icon: 'peanut', iconType: 'material' },
    { id: 'african-walnut', name: 'African Walnut', icon: 'peanut-outline', iconType: 'material' },
    { id: 'tiger-nuts', name: 'Tiger Nuts', icon: 'peanut', iconType: 'material' },
    { id: 'almonds', name: 'Almonds', icon: 'peanut-outline', iconType: 'material' },
    { id: 'walnuts', name: 'Walnuts', icon: 'peanut', iconType: 'material' },
  ],
  tubers: [
    { id: 'yam', name: 'Yam', icon: 'food-variant', iconType: 'material' },
    { id: 'cassava', name: 'Cassava', icon: 'carrot', iconType: 'material' },
    { id: 'potatoes', name: 'Irish Potatoes', icon: 'food-variant', iconType: 'material' },
    { id: 'sweet-potato', name: 'Sweet Potato', icon: 'carrot', iconType: 'material' },
    { id: 'cocoyam', name: 'Cocoyam', icon: 'food-variant', iconType: 'material' },
    { id: 'water-yam', name: 'Water Yam', icon: 'food-variant', iconType: 'material' },
  ],
  oils: [
    { id: 'palm-oil', name: 'Palm Oil', icon: 'oil', iconType: 'material' },
    { id: 'groundnut-oil', name: 'Groundnut Oil', icon: 'oil', iconType: 'material' },
    { id: 'coconut-oil', name: 'Coconut Oil', icon: 'oil', iconType: 'material' },
    { id: 'olive-oil', name: 'Olive Oil', icon: 'bottle-tonic', iconType: 'material' },
    { id: 'shea-butter', name: 'Shea Butter', icon: 'oil', iconType: 'material' },
    { id: 'vegetable-oil', name: 'Vegetable Oil', icon: 'bottle-tonic-outline', iconType: 'material' },
  ],
  legumes: [
    { id: 'beans', name: 'Beans (Ewa)', icon: 'seed', iconType: 'material' },
    { id: 'cowpeas', name: 'Cowpeas', icon: 'seed', iconType: 'material' },
    { id: 'soybeans', name: 'Soybeans', icon: 'seed-outline', iconType: 'material' },
    { id: 'pigeon-peas', name: 'Pigeon Peas', icon: 'seed', iconType: 'material' },
    { id: 'lentils', name: 'Lentils', icon: 'seed', iconType: 'material' },
    { id: 'black-eyed-peas', name: 'Black-eyed Peas', icon: 'seed-outline', iconType: 'material' },
    { id: 'bambara-nuts', name: 'Bambara Nuts', icon: 'peanut', iconType: 'material' },
    { id: 'locust-beans-iru', name: 'Locust Beans (Iru)', icon: 'seed', iconType: 'material' },
  ],
  processed: [
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
  livestock: [
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
  seeds: [
    { id: 'melon-seeds', name: 'Melon Seeds', icon: 'seed', iconType: 'material' },
    { id: 'sesame-seeds', name: 'Sesame Seeds', icon: 'seed-outline', iconType: 'material' },
    { id: 'pumpkin-seeds', name: 'Pumpkin Seeds', icon: 'seed', iconType: 'material' },
    { id: 'sunflower-seeds', name: 'Sunflower Seeds', icon: 'seed-outline', iconType: 'material' },
    { id: 'flax-seeds', name: 'Flax Seeds', icon: 'seed', iconType: 'material' },
    { id: 'chia-seeds', name: 'Chia Seeds', icon: 'seed-outline', iconType: 'material' },
    { id: 'ogiri', name: 'Ogiri', icon: 'seed', iconType: 'material' },
    { id: 'dawadawa', name: 'Dawadawa', icon: 'seed', iconType: 'material' },
  ],
  beverages: [
    { id: 'palm-wine', name: 'Palm Wine', icon: 'glass-wine', iconType: 'material' },
    { id: 'zobo', name: 'Zobo Leaves', icon: 'leaf', iconType: 'material' },
    { id: 'kunu', name: 'Kunu', icon: 'cup', iconType: 'material' },
    { id: 'fura-da-nono', name: 'Fura da Nono', icon: 'cup-water', iconType: 'material' },
    { id: 'tiger-nuts-drink', name: 'Tiger Nuts', icon: 'cup', iconType: 'material' },
    { id: 'ginger', name: 'Ginger', icon: 'food-variant', iconType: 'material' },
    { id: 'cocoa', name: 'Cocoa', icon: 'coffee', iconType: 'material' },
    { id: 'hibiscus', name: 'Hibiscus', icon: 'flower', iconType: 'material' },
  ],
  others: [
    { id: 'other', name: 'Other Products', icon: 'package-variant', iconType: 'material' },
  ],
};

// Helper function to get category info by ID
export const getCategoryById = (id: ProductCategory): CategoryInfo | undefined => {
  return PRODUCT_CATEGORIES.find(cat => cat.id === id);
};

// Helper function to get subcategories by category ID
export const getSubcategoriesByCategoryId = (categoryId: ProductCategory): SubcategoryInfo[] => {
  return CATEGORY_SUBCATEGORIES[categoryId] || [];
};

// Helper function to get category display name
export const getCategoryDisplayName = (categoryId: string): string => {
  const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
  return category?.name || categoryId;
};

// Helper function to get subcategory display name
export const getSubcategoryDisplayName = (subcategoryId: string): string => {
  // Look through all subcategories
  for (const subcategories of Object.values(CATEGORY_SUBCATEGORIES)) {
    const found = subcategories.find(sub => sub.id === subcategoryId);
    if (found) return found.name;
  }
  // Fallback: convert kebab-case to Title Case
  return subcategoryId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

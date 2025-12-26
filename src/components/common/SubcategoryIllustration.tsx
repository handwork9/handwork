import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import all subcategory illustrations
import CarrotIllustration from '../../assets/illustrations/subcategories/CarrotIllustration';
import TomatoIllustration from '../../assets/illustrations/subcategories/TomatoIllustration';
import PepperIllustration from '../../assets/illustrations/subcategories/PepperIllustration';
import LeafyGreensIllustration from '../../assets/illustrations/subcategories/LeafyGreensIllustration';
import OnionIllustration from '../../assets/illustrations/subcategories/OnionIllustration';
import RiceIllustration from '../../assets/illustrations/subcategories/RiceIllustration';
import CornIllustration from '../../assets/illustrations/subcategories/CornIllustration';
import ChickenIllustration from '../../assets/illustrations/subcategories/ChickenIllustration';
import FishIllustration from '../../assets/illustrations/subcategories/FishIllustration';
import CassavaIllustration from '../../assets/illustrations/subcategories/CassavaIllustration';
import HoneycombIllustration from '../../assets/illustrations/subcategories/HoneycombIllustration';
import ShrimpIllustration from '../../assets/illustrations/subcategories/ShrimpIllustration';
import CrabIllustration from '../../assets/illustrations/subcategories/CrabIllustration';
import DriedFishIllustration from '../../assets/illustrations/subcategories/DriedFishIllustration';
import CatfishIllustration from '../../assets/illustrations/subcategories/CatfishIllustration';
import SmokedFishIllustration from '../../assets/illustrations/subcategories/SmokedFishIllustration';
import StockfishIllustration from '../../assets/illustrations/subcategories/StockfishIllustration';
import PeriwinkleIllustration from '../../assets/illustrations/subcategories/PeriwinkleIllustration';
import TurkeyIllustration from '../../assets/illustrations/subcategories/TurkeyIllustration';
import DuckIllustration from '../../assets/illustrations/subcategories/DuckIllustration';
import GuineaFowlIllustration from '../../assets/illustrations/subcategories/GuineaFowlIllustration';
import BeansIllustration from '../../assets/illustrations/subcategories/BeansIllustration';
import WheatIllustration from '../../assets/illustrations/subcategories/WheatIllustration';
import MilletIllustration from '../../assets/illustrations/subcategories/MilletIllustration';
import SorghumIllustration from '../../assets/illustrations/subcategories/SorghumIllustration';
import OatsIllustration from '../../assets/illustrations/subcategories/OatsIllustration';
// Realistic fruit illustrations
import PawpawIllustration from '../../assets/illustrations/subcategories/PawpawIllustration';
import WatermelonIllustration from '../../assets/illustrations/subcategories/WatermelonIllustration';
import GuavaIllustration from '../../assets/illustrations/subcategories/GuavaIllustration';
import AvocadoIllustration from '../../assets/illustrations/subcategories/AvocadoIllustration';
import CoconutIllustration from '../../assets/illustrations/subcategories/CoconutIllustration';
import AppleIllustration from '../../assets/illustrations/subcategories/AppleIllustration';
import GrapesIllustration from '../../assets/illustrations/subcategories/GrapesIllustration';
import SoursopIllustration from '../../assets/illustrations/subcategories/SoursopIllustration';
import MangoRealisticIllustration from '../../assets/illustrations/subcategories/MangoRealisticIllustration';
import BananaRealisticIllustration from '../../assets/illustrations/subcategories/BananaRealisticIllustration';
import OrangeRealisticIllustration from '../../assets/illustrations/subcategories/OrangeRealisticIllustration';
import PineappleRealisticIllustration from '../../assets/illustrations/subcategories/PineappleRealisticIllustration';
// Realistic dairy illustrations
import MilkRealisticIllustration from '../../assets/illustrations/subcategories/MilkRealisticIllustration';
import CheeseRealisticIllustration from '../../assets/illustrations/subcategories/CheeseRealisticIllustration';
import YogurtIllustration from '../../assets/illustrations/subcategories/YogurtIllustration';
import ButterIllustration from '../../assets/illustrations/subcategories/ButterIllustration';
import WaraIllustration from '../../assets/illustrations/subcategories/WaraIllustration';
import NonoIllustration from '../../assets/illustrations/subcategories/NonoIllustration';
import FuraIllustration from '../../assets/illustrations/subcategories/FuraIllustration';
// Realistic egg illustrations
import ChickenEggsIllustration from '../../assets/illustrations/subcategories/ChickenEggsIllustration';
import DuckEggsIllustration from '../../assets/illustrations/subcategories/DuckEggsIllustration';
import QuailEggsIllustration from '../../assets/illustrations/subcategories/QuailEggsIllustration';
import OrganicEggsIllustration from '../../assets/illustrations/subcategories/OrganicEggsIllustration';
// Realistic meat illustrations
import BeefIllustration from '../../assets/illustrations/subcategories/BeefIllustration';
import GoatMeatIllustration from '../../assets/illustrations/subcategories/GoatMeatIllustration';
import LambIllustration from '../../assets/illustrations/subcategories/LambIllustration';
import PorkIllustration from '../../assets/illustrations/subcategories/PorkIllustration';
import BushMeatIllustration from '../../assets/illustrations/subcategories/BushMeatIllustration';
import SnailIllustration from '../../assets/illustrations/subcategories/SnailIllustration';
// Realistic poultry illustrations
import ChickenMeatIllustration from '../../assets/illustrations/subcategories/ChickenMeatIllustration';
import TurkeyMeatIllustration from '../../assets/illustrations/subcategories/TurkeyMeatIllustration';
import DuckMeatIllustration from '../../assets/illustrations/subcategories/DuckMeatIllustration';
import GuineaFowlMeatIllustration from '../../assets/illustrations/subcategories/GuineaFowlMeatIllustration';
import QuailMeatIllustration from '../../assets/illustrations/subcategories/QuailMeatIllustration';
import PigeonMeatIllustration from '../../assets/illustrations/subcategories/PigeonMeatIllustration';
// Realistic honey illustrations
import RawHoneyIllustration from '../../assets/illustrations/subcategories/RawHoneyIllustration';
import ProcessedHoneyIllustration from '../../assets/illustrations/subcategories/ProcessedHoneyIllustration';
import HoneycombRealisticIllustration from '../../assets/illustrations/subcategories/HoneycombRealisticIllustration';
import PropolisIllustration from '../../assets/illustrations/subcategories/PropolisIllustration';
import BeeswaxIllustration from '../../assets/illustrations/subcategories/BeeswaxIllustration';
// Realistic nuts illustrations
import GroundnutIllustration from '../../assets/illustrations/subcategories/GroundnutIllustration';
import CashewIllustration from '../../assets/illustrations/subcategories/CashewIllustration';
import KolanutIllustration from '../../assets/illustrations/subcategories/KolanutIllustration';
import BitterKolaIllustration from '../../assets/illustrations/subcategories/BitterKolaIllustration';
import WalnutIllustration from '../../assets/illustrations/subcategories/WalnutIllustration';
import PalmNutsIllustration from '../../assets/illustrations/subcategories/PalmNutsIllustration';
import AlmondIllustration from '../../assets/illustrations/subcategories/AlmondIllustration';
// Realistic tuber illustrations
import YamIllustration from '../../assets/illustrations/subcategories/YamIllustration';
import CassavaRealisticIllustration from '../../assets/illustrations/subcategories/CassavaRealisticIllustration';
import PotatoIllustration from '../../assets/illustrations/subcategories/PotatoIllustration';
import SweetPotatoIllustration from '../../assets/illustrations/subcategories/SweetPotatoIllustration';
import CocoyamIllustration from '../../assets/illustrations/subcategories/CocoyamIllustration';
import WaterYamIllustration from '../../assets/illustrations/subcategories/WaterYamIllustration';
// Realistic oil illustrations
import PalmOilIllustration from '../../assets/illustrations/subcategories/PalmOilIllustration';
import GroundnutOilIllustration from '../../assets/illustrations/subcategories/GroundnutOilIllustration';
import CoconutOilIllustration from '../../assets/illustrations/subcategories/CoconutOilIllustration';
import OliveOilIllustration from '../../assets/illustrations/subcategories/OliveOilIllustration';
import SheaButterIllustration from '../../assets/illustrations/subcategories/SheaButterIllustration';
import VegetableOilIllustration from '../../assets/illustrations/subcategories/VegetableOilIllustration';
// Realistic legume illustrations
import CowpeasIllustration from '../../assets/illustrations/subcategories/CowpeasIllustration';
import SoybeansIllustration from '../../assets/illustrations/subcategories/SoybeansIllustration';
import PigeonPeasIllustration from '../../assets/illustrations/subcategories/PigeonPeasIllustration';
import LentilsIllustration from '../../assets/illustrations/subcategories/LentilsIllustration';
import BlackEyedPeasIllustration from '../../assets/illustrations/subcategories/BlackEyedPeasIllustration';
import BeansEwaIllustration from '../../assets/illustrations/subcategories/BeansEwaIllustration';
import BambaraNutsIllustration from '../../assets/illustrations/subcategories/BambaraNutsIllustration';
import LocustBeansIllustration from '../../assets/illustrations/subcategories/LocustBeansIllustration';

// Map subcategory IDs to their illustration components
const SUBCATEGORY_ILLUSTRATION_MAP: Record<string, React.FC<{ width?: number; height?: number; color?: string }>> = {
  // Vegetables
  carrot: CarrotIllustration,
  carrots: CarrotIllustration,
  tomato: TomatoIllustration,
  tomatoes: TomatoIllustration,
  pepper: PepperIllustration,
  peppers: PepperIllustration,
  chili: PepperIllustration,
  'leafy-greens': LeafyGreensIllustration,
  leafy_greens: LeafyGreensIllustration,
  ugwu: LeafyGreensIllustration,
  ewedu: LeafyGreensIllustration,
  waterleaf: LeafyGreensIllustration,
  'bitter-leaf': LeafyGreensIllustration,
  spinach: LeafyGreensIllustration,
  lettuce: LeafyGreensIllustration,
  cabbage: LeafyGreensIllustration,
  onion: OnionIllustration,
  onions: OnionIllustration,
  garlic: OnionIllustration,
  
  // Fruits - using realistic illustrations
  mango: MangoRealisticIllustration,
  pawpaw: PawpawIllustration,
  papaya: PawpawIllustration,
  guava: GuavaIllustration,
  soursop: SoursopIllustration,
  apple: AppleIllustration,
  avocado: AvocadoIllustration,
  banana: BananaRealisticIllustration,
  bananas: BananaRealisticIllustration,
  plantain: BananaRealisticIllustration,
  plantains: BananaRealisticIllustration,
  orange: OrangeRealisticIllustration,
  oranges: OrangeRealisticIllustration,
  citrus: OrangeRealisticIllustration,
  tangerine: OrangeRealisticIllustration,
  lemon: OrangeRealisticIllustration,
  lime: OrangeRealisticIllustration,
  'coconut-fruit': CoconutIllustration,
  coconut: CoconutIllustration,
  grapes: GrapesIllustration,
  watermelon: WatermelonIllustration,
  pineapple: PineappleRealisticIllustration,
  
  // Grains
  rice: RiceIllustration,
  beans: BeansIllustration,
  corn: CornIllustration,
  maize: CornIllustration,
  'guinea-corn': SorghumIllustration,
  millet: MilletIllustration,
  sorghum: SorghumIllustration,
  acha: MilletIllustration,
  fonio: MilletIllustration,
  wheat: WheatIllustration,
  oats: OatsIllustration,
  barley: WheatIllustration,
  
  // Dairy - using realistic illustrations
  milk: MilkRealisticIllustration,
  'fresh-milk': MilkRealisticIllustration,
  cheese: CheeseRealisticIllustration,
  wara: WaraIllustration,
  yogurt: YogurtIllustration,
  fura: FuraIllustration,
  nono: NonoIllustration,
  'fura-da-nono': FuraIllustration,
  butter: ButterIllustration,
  cream: MilkRealisticIllustration,
  
  // Eggs - using realistic illustrations
  'chicken-eggs': ChickenEggsIllustration,
  eggs: ChickenEggsIllustration,
  egg: ChickenEggsIllustration,
  'duck-eggs': DuckEggsIllustration,
  'quail-eggs': QuailEggsIllustration,
  'organic-eggs': OrganicEggsIllustration,
  'free-range-eggs': OrganicEggsIllustration,
  'local-eggs': ChickenEggsIllustration,
  
  // Meat - using realistic illustrations
  beef: BeefIllustration,
  'beef-cuts': BeefIllustration,
  steak: BeefIllustration,
  goat: GoatMeatIllustration,
  'goat-meat': GoatMeatIllustration,
  mutton: GoatMeatIllustration,
  lamb: LambIllustration,
  'lamb-chops': LambIllustration,
  pork: PorkIllustration,
  'pork-belly': PorkIllustration,
  bacon: PorkIllustration,
  'bush-meat': BushMeatIllustration,
  'game-meat': BushMeatIllustration,
  'grass-cutter': BushMeatIllustration,
  snail: SnailIllustration,
  snails: SnailIllustration,
  processed: BeefIllustration,
  
  // Poultry
  chicken: ChickenMeatIllustration,
  turkey: TurkeyMeatIllustration,
  duck: DuckMeatIllustration,
  'guinea-fowl': GuineaFowlMeatIllustration,
  goose: DuckMeatIllustration,
  quail: QuailMeatIllustration,
  pigeon: PigeonMeatIllustration,
  
  // Seafood
  fish: FishIllustration,
  'fresh-fish': FishIllustration,
  tilapia: FishIllustration,
  catfish: CatfishIllustration,
  croaker: FishIllustration,
  'dried-fish': DriedFishIllustration,
  'smoked-fish': SmokedFishIllustration,
  stockfish: StockfishIllustration,
  shrimp: ShrimpIllustration,
  crayfish: ShrimpIllustration,
  crab: CrabIllustration,
  periwinkle: PeriwinkleIllustration,
  lobster: ShrimpIllustration,
  prawn: ShrimpIllustration,
  oyster: PeriwinkleIllustration,
  clam: PeriwinkleIllustration,
  
  // Herbs & Spices
  'fresh-herbs': LeafyGreensIllustration,
  uziza: LeafyGreensIllustration,
  'scent-leaf': LeafyGreensIllustration,
  'curry-leaves': LeafyGreensIllustration,
  thyme: LeafyGreensIllustration,
  'dried-herbs': LeafyGreensIllustration,
  spices: PepperIllustration,
  'cameroon-pepper': PepperIllustration,
  cinnamon: LeafyGreensIllustration,
  
  // Tubers - using realistic illustrations
  cassava: CassavaRealisticIllustration,
  yuca: CassavaRealisticIllustration,
  yam: YamIllustration,
  potato: PotatoIllustration,
  potatoes: PotatoIllustration,
  'sweet-potato': SweetPotatoIllustration,
  cocoyam: CocoyamIllustration,
  'water-yam': WaterYamIllustration,
  ginger: OnionIllustration,
  turmeric: OnionIllustration,
  
  // Honey - using realistic illustrations
  honeycomb: HoneycombRealisticIllustration,
  honey: RawHoneyIllustration,
  'raw-honey': RawHoneyIllustration,
  'processed-honey': ProcessedHoneyIllustration,
  propolis: PropolisIllustration,
  beeswax: BeeswaxIllustration,
  
  // Oils - using realistic illustrations
  'palm-oil': PalmOilIllustration,
  'groundnut-oil': GroundnutOilIllustration,
  'coconut-oil': CoconutOilIllustration,
  'olive-oil': OliveOilIllustration,
  'shea-butter': SheaButterIllustration,
  'vegetable-oil': VegetableOilIllustration,
  
  // Legumes - using realistic illustrations
  cowpeas: CowpeasIllustration,
  'cow-peas': CowpeasIllustration,
  soybeans: SoybeansIllustration,
  'soy-beans': SoybeansIllustration,
  soya: SoybeansIllustration,
  'pigeon-peas': PigeonPeasIllustration,
  'pigeon-pea': PigeonPeasIllustration,
  lentils: LentilsIllustration,
  lentil: LentilsIllustration,
  'black-eyed-peas': BlackEyedPeasIllustration,
  'black-eyed-beans': BlackEyedPeasIllustration,
  ewa: BeansEwaIllustration,
  'beans-ewa': BeansEwaIllustration,
  'honey-beans': BeansEwaIllustration,
  'bambara-nuts': BambaraNutsIllustration,
  'bambara-groundnut': BambaraNutsIllustration,
  okpa: BambaraNutsIllustration,
  'locust-beans': LocustBeansIllustration,
  iru: LocustBeansIllustration,
  dawadawa: LocustBeansIllustration,
  
  // Nuts - using realistic illustrations
  groundnut: GroundnutIllustration,
  groundnuts: GroundnutIllustration,
  peanut: GroundnutIllustration,
  peanuts: GroundnutIllustration,
  cashew: CashewIllustration,
  'cashew-nuts': CashewIllustration,
  kolanut: KolanutIllustration,
  'kola-nut': KolanutIllustration,
  'bitter-kola': BitterKolaIllustration,
  walnut: WalnutIllustration,
  walnuts: WalnutIllustration,
  'palm-nuts': PalmNutsIllustration,
  'palm-kernel': PalmNutsIllustration,
  almond: AlmondIllustration,
  almonds: AlmondIllustration,
  
  // Seeds (keeping with RiceIllustration for now)
  melon: RiceIllustration,
  'melon-seeds': RiceIllustration,
  'egusi': RiceIllustration,
  'ogbono': RiceIllustration,
  
  // Livestock
  cattle: ChickenIllustration,
  goats: ChickenIllustration,
  sheep: ChickenIllustration,
  pigs: ChickenIllustration,
  rabbits: ChickenIllustration,
  
  // Beverages
  'palm-wine': MilkRealisticIllustration,
  'fruit-juice': OrangeRealisticIllustration,
  'zobo': MilkRealisticIllustration,
  'kunu': MilkRealisticIllustration,
};

// Fallback icon configuration for items without illustrations
const FALLBACK_ICONS: Record<string, string> = {
  // Vegetables
  okra: 'food-variant',
  'garden-egg': 'food-apple-outline',
  cucumber: 'food-variant',
  
  // Generic fallbacks by category
  leaf: 'leaf',
  fruit: 'fruit-cherries',
  grain: 'barley',
  dairy: 'cup',
  egg: 'egg',
  meat: 'food-steak',
  poultry: 'food-drumstick',
  seafood: 'fish',
  herb: 'leaf',
  spice: 'chili-hot',
  tuber: 'food-variant',
  oil: 'oil',
  nut: 'peanut',
  seed: 'seed',
  beverage: 'cup-water',
  livestock: 'cow',
  other: 'package-variant',
};

interface SubcategoryIllustrationProps {
  subcategoryId: string;
  size?: number;
  color?: string;
  useIllustration?: boolean;
  containerStyle?: object;
  fallbackIcon?: string; // Icon name from the subcategory data
}

const SubcategoryIllustration: React.FC<SubcategoryIllustrationProps> = ({
  subcategoryId,
  size = 48,
  color,
  useIllustration = true,
  containerStyle,
  fallbackIcon,
}) => {
  // Normalize subcategory ID
  const normalizedId = (subcategoryId || '').toLowerCase().replace(/[\s]/g, '-');
  
  // Try to get the illustration component
  const IllustrationComponent = useIllustration ? SUBCATEGORY_ILLUSTRATION_MAP[normalizedId] : null;
  
  if (IllustrationComponent) {
    return (
      <View style={[styles.container, containerStyle]}>
        <IllustrationComponent width={size} height={size} color={color} />
      </View>
    );
  }
  
  // Fallback to provided icon, then FALLBACK_ICONS, then generic food icon
  const iconName = fallbackIcon || FALLBACK_ICONS[normalizedId] || 'food-variant';
  
  return (
    <View style={[styles.container, containerStyle]}>
      <MaterialCommunityIcons 
        name={iconName as any} 
        size={size * 0.6} 
        color={color || '#666'} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubcategoryIllustration;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import { triggerHaptic, triggerSelectionHaptic } from '../../utils/haptics';

interface FloatingSocialMenuProps {
  isFarmer?: boolean;
}

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  gradient: [string, string];
  farmerOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'feed',
    icon: 'people',
    label: 'Community',
    route: 'SocialFeed',
    gradient: ['#66BB6A', '#43A047'],
  },
  {
    id: 'stories',
    icon: 'images',
    label: 'Stories',
    route: 'Stories',
    gradient: ['#FFB74D', '#F57C00'],
  },
  {
    id: 'live',
    icon: 'radio',
    label: 'Live Streams',
    route: 'LiveStreams',
    gradient: ['#EF5350', '#D32F2F'],
  },
  {
    id: 'golive',
    icon: 'videocam',
    label: 'Go Live',
    route: 'GoLive',
    gradient: ['#BA68C8', '#7B1FA2'],
    farmerOnly: true,
  },
  {
    id: 'createpost',
    icon: 'create',
    label: 'Create Post',
    route: 'CreatePost',
    gradient: ['#64B5F6', '#1976D2'],
    farmerOnly: true,
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingSocialMenu: React.FC<FloatingSocialMenuProps> = ({ isFarmer = false }) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const itemAnimations = useRef(MENU_ITEMS.map(() => new Animated.Value(0))).current;

  const filteredItems = MENU_ITEMS.filter(item => !item.farmerOnly || isFarmer);
  const bottomPosition = 100 + insets.bottom;

  const openMenu = () => {
    setIsOpen(true);
    triggerHaptic();
    
    Animated.spring(rotateAnimation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();

    filteredItems.forEach((_, index) => {
      Animated.spring(itemAnimations[index], {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
        delay: index * 50,
      }).start();
    });
  };

  const closeMenu = () => {
    Animated.spring(rotateAnimation, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();

    filteredItems.forEach((_, index) => {
      Animated.timing(itemAnimations[index], {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => setIsOpen(false), 150);
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleMenuItemPress = (route: string) => {
    triggerSelectionHaptic();
    closeMenu();
    setTimeout(() => {
      navigation.navigate(route as never);
    }, 200);
  };

  const fabRotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Main FAB - Always visible */}
      <View style={[styles.fabContainer, { bottom: bottomPosition }]}>
        <TouchableOpacity onPress={toggleMenu} activeOpacity={0.9}>
          <LinearGradient
            colors={isOpen ? ['#FF6B6B', '#EE5A5A'] : ['#4CAF50', '#43A047']}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
              <Ionicons 
                name={isOpen ? 'close' : 'sparkles'} 
                size={26} 
                color="#FFFFFF" 
              />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Menu Modal - Renders above everything */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        {/* Backdrop */}
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <View style={styles.backdropInner} />
        </Pressable>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { bottom: bottomPosition + 70 }]} pointerEvents="box-none">
          {filteredItems.map((item, index) => {
            const translateY = itemAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            });

            const opacity = itemAnimations[index];
            const scale = itemAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.menuItemWrapper,
                  {
                    transform: [{ translateY }, { scale }],
                    opacity,
                    marginBottom: 12,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.menuItemLabel,
                    { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
                  ]}>
                    <Text style={[styles.menuItemLabelText, { color: colors.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.menuItemButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* FAB inside modal (for closing) */}
        <View style={[styles.fabContainer, { bottom: bottomPosition }]}>
          <TouchableOpacity onPress={closeMenu} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FF6B6B', '#EE5A5A']}
              style={styles.fab}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdropInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  menuItemWrapper: {
    alignItems: 'flex-end',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItemLabelText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  menuItemButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default FloatingSocialMenu;

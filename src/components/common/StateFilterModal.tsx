import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

// Nigerian States
const NIGERIAN_STATES = [
  'All States',
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

interface StateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StateFilterModal({
  visible,
  onClose,
  selectedState,
  onSelectState,
}: StateFilterModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return NIGERIAN_STATES;
    return NIGERIAN_STATES.filter((state) =>
      state.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectState = (state: string) => {
    if (state === 'All States') {
      onSelectState(null);
    } else {
      onSelectState(state);
    }
    onClose();
  };

  const renderStateItem = ({ item }: { item: string }) => {
    const isSelected = item === 'All States' ? !selectedState : selectedState === item;

    return (
      <TouchableOpacity
        style={[
          styles.stateItem,
          { 
            backgroundColor: isSelected 
              ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
              : 'transparent',
            borderColor: isSelected ? COLORS.primary : 'transparent',
          },
        ]}
        onPress={() => handleSelectState(item)}
        activeOpacity={0.7}
      >
        <View style={styles.stateItemContent}>
          <Ionicons 
            name={item === 'All States' ? 'globe-outline' : 'location-outline'} 
            size={20} 
            color={isSelected ? COLORS.primary : colors.textSecondary} 
          />
          <Text
            style={[
              styles.stateText,
              { color: isSelected ? COLORS.primary : colors.text },
              isSelected && styles.stateTextSelected,
            ]}
          >
            {item}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              paddingBottom: insets.bottom + SPACING.md,
              maxHeight: SCREEN_HEIGHT * 0.75,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Filter by State
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDark ? colors.background : '#F5F5F5',
                borderColor: isDark ? colors.border : '#E0E0E0',
              },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search states..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Current Selection */}
          {selectedState && (
            <View style={[styles.currentSelection, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.1)' }]}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={[styles.currentSelectionText, { color: COLORS.primary }]}>
                Currently viewing: {selectedState}
              </Text>
              <TouchableOpacity onPress={() => handleSelectState('All States')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* States List */}
          <FlatList
            data={filteredStates}
            keyExtractor={(item) => item}
            renderItem={renderStateItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: isDark ? colors.border : '#F0F0F0' }]} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No states found
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    paddingVertical: 4,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  currentSelectionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  clearText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    marginVertical: 2,
  },
  stateItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  stateTextSelected: {
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    marginHorizontal: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});

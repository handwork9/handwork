import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BuyerStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import shoppingListService, { ShoppingList, ShoppingListItem } from '../../services/shoppingListService';
import { cartService } from '../../services/cartService';
import { useAppDispatch } from '../../store';
import { addToCart } from '../../store/slices/cartSlice';
import { triggerHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { getFirstValidImageUrl } from '../../utils/formatters';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

export default function ShoppingListsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);

  // Fetch all shopping lists
  const {
    data: lists,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: () => shoppingListService.getAll(),
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (name: string) => shoppingListService.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      setShowCreateModal(false);
      setNewListName('');
      triggerSuccessHaptic();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create list');
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => shoppingListService.delete(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      triggerHaptic();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete list');
    },
  });

  // Toggle item purchased mutation
  const toggleItemMutation = useMutation({
    mutationFn: ({ listId, itemId, isPurchased }: { listId: string; itemId: string; isPurchased: boolean }) =>
      shoppingListService.updateItem(listId, itemId, { isPurchased }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      shoppingListService.removeItem(listId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a name for your list');
      return;
    }
    createListMutation.mutate(newListName.trim());
  };

  const handleDeleteList = (list: ShoppingList) => {
    if (list.isDefault) {
      Alert.alert('Cannot Delete', 'You cannot delete your default shopping list');
      return;
    }

    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteListMutation.mutate(list.id),
        },
      ]
    );
  };

  const handleToggleItem = (listId: string, item: ShoppingListItem) => {
    triggerHaptic();
    toggleItemMutation.mutate({
      listId,
      itemId: item.id,
      isPurchased: !item.isPurchased,
    });
  };

  const handleRemoveItem = (listId: string, item: ShoppingListItem) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.product.title}" from list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            triggerHaptic();
            removeItemMutation.mutate({ listId, itemId: item.id });
          },
        },
      ]
    );
  };

  const handleAddAllToCart = async (list: ShoppingList) => {
    const unpurchasedItems = list.items.filter((item) => !item.isPurchased);
    if (unpurchasedItems.length === 0) {
      Alert.alert('No Items', 'All items in this list are already purchased');
      return;
    }

    try {
      for (const item of unpurchasedItems) {
        await cartService.addToCart(item.productId, item.quantity);
        dispatch(
          addToCart({
            product: item.product as any,
            quantity: item.quantity,
          })
        );
      }
      triggerSuccessHaptic();
      Alert.alert('Success', `Added ${unpurchasedItems.length} items to cart`, [
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        { text: 'OK' },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add items to cart');
    }
  };

  const handleShareList = (list: ShoppingList) => {
    if (list.visibility === 'shared' && list.shareCode) {
      Alert.alert('Share List', `Share code: ${list.shareCode}`, [
        { text: 'OK' },
      ]);
    } else {
      Alert.alert(
        'Make List Shareable',
        'This will generate a share code for your list.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              await shoppingListService.update(list.id, { visibility: 'shared' });
              queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
            },
          },
        ]
      );
    }
  };

  const renderListCard = (list: ShoppingList) => {
    const progress = shoppingListService.getProgress(list.items);
    const estimatedTotal = shoppingListService.calculateEstimatedTotal(list.items);

    return (
      <TouchableOpacity
        key={list.id}
        style={[styles.listCard, { backgroundColor: isDark ? colors.card : '#fff' }]}
        onPress={() => setSelectedList(selectedList?.id === list.id ? null : list)}
        activeOpacity={0.7}
      >
        <View style={styles.listHeader}>
          <View style={styles.listInfo}>
            <View style={styles.listTitleRow}>
              <Text style={[styles.listName, { color: colors.text }]}>{list.name}</Text>
              {list.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
              {list.visibility === 'shared' && (
                <Ionicons name="link" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
              {list.items.length} items • Est. ₦{estimatedTotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShareList(list)}
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteList(list)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? colors.surface : '#E5E7EB' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {progress}% complete
          </Text>
        </View>

        {/* Expanded Items */}
        {selectedList?.id === list.id && (
          <View style={styles.expandedContent}>
            {list.items.length === 0 ? (
              <View style={styles.emptyItems}>
                <Ionicons name="basket-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No items in this list
                </Text>
                <TouchableOpacity
                  style={[styles.browseButton, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('BuyerTabs')}
                >
                  <Text style={styles.browseButtonText}>Browse Products</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {list.items.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      item.isPurchased && styles.itemPurchased,
                      { borderBottomColor: isDark ? colors.surface : '#E5E7EB' },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleToggleItem(list.id, item)}
                    >
                      <Ionicons
                        name={item.isPurchased ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={item.isPurchased ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {getFirstValidImageUrl(item.product.images) ? (
                      <Image
                        source={{ uri: getFirstValidImageUrl(item.product.images)! }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.imagePlaceholder, { backgroundColor: isDark ? colors.surface : '#E8F5E9' }]}>
                        <Ionicons name="leaf" size={20} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemName,
                          { color: colors.text },
                          item.isPurchased && styles.itemNameStrikethrough,
                        ]}
                        numberOfLines={1}
                      >
                        {item.product.title}
                      </Text>
                      <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                        ₦{Number(item.product.price).toLocaleString()} × {item.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => handleRemoveItem(list.id, item)}
                    >
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleAddAllToCart(list)}
                >
                  <Ionicons name="cart" size={20} color="#fff" />
                  <Text style={styles.addToCartText}>Add All to Cart</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={styles.expandIndicator}>
          <Ionicons
            name={selectedList?.id === list.id ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping Lists</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : lists && lists.length > 0 ? (
          lists.map(renderListCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Shopping Lists</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Create a shopping list to keep track of items you want to buy
            </Text>
            <TouchableOpacity
              style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createFirstButtonText}>Create Your First List</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New List</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? colors.surface : '#F3F4F6',
                  color: colors.text,
                  borderColor: isDark ? colors.surface : '#E5E7EB',
                },
              ]}
              placeholder="List name"
              placeholderTextColor={colors.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateList}
                disabled={createListMutation.isPending}
              >
                {createListMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Bottom Sheet - How Shopping Lists Work */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable 
            style={styles.bottomSheetDismissArea} 
            onPress={() => setShowInfoModal(false)}
          />
          <View style={[styles.bottomSheetContent, { backgroundColor: isDark ? colors.card : '#fff' }]}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>How Shopping Lists Work</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.infoModalScroll} 
              showsVerticalScrollIndicator={false}
              bounces={true}
              nestedScrollEnabled={true}
            >
              {/* Create Lists */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="add-circle" size={24} color="#3B82F6" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Create Multiple Lists</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    Organize your shopping with multiple lists like "Weekly Groceries", "Party Supplies", or "Monthly Staples". One list can be set as your default for quick adding.
                  </Text>
                </View>
              </View>

              {/* Add Products */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="basket" size={24} color="#22C55E" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Add Products</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    Browse products and tap the "Add to List" button on any product. Set the quantity and add notes like "Get the ripe ones". If you add the same product twice, the quantity increases automatically.
                  </Text>
                </View>
              </View>

              {/* Track Progress */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="checkbox" size={24} color="#F59E0B" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Check Off Items</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    While shopping, tap items to mark them as purchased. The progress bar shows how much of your list is complete. Stay organized and never forget an item!
                  </Text>
                </View>
              </View>

              {/* Add to Cart */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="cart" size={24} color="#7C3AED" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Quick Add to Cart</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    Ready to buy? Tap "Add All to Cart" to move all unpurchased items from your list directly to your shopping cart with the right quantities. Checkout in seconds!
                  </Text>
                </View>
              </View>

              {/* Share Lists */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="share-social" size={24} color="#EF4444" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Share with Family</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    Make any list shareable to generate a unique code. Share it with family or friends so they can view your list and know exactly what to get.
                  </Text>
                </View>
              </View>

              {/* Estimated Total */}
              <View style={styles.infoSection}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="calculator" size={24} color="#10B981" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Estimated Total</Text>
                  <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                    See the estimated cost of your shopping list based on current product prices. Plan your budget before you shop!
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.bottomSheetButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.bottomSheetButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  listCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  defaultBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#3B82F6',
  },
  listMeta: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    width: 70,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  emptyItems: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 8,
  },
  browseButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemPurchased: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 10,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  itemNameStrikethrough: {
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  removeItemButton: {
    padding: 4,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  addToCartText: {
    color: '#fff',
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createFirstButtonText: {
    color: '#fff',
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  confirmButton: {},
  confirmButtonText: {
    color: '#fff',
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetDismissArea: {
    flex: 1,
  },
  bottomSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  infoModalScroll: {
    maxHeight: 400,
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  infoSectionText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomSheetButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  bottomSheetButtonText: {
    color: '#fff',
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
});

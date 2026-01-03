import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BuyerStackParamList } from '../../types';
import { Button, EmptyState } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeFromCart, updateQuantity, clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../services/cartService';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerErrorHaptic, triggerSelectionHaptic } from '../../utils/haptics';
import { getFirstValidImageUrl } from '../../utils/formatters';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { items, total, itemCount } = useAppSelector((state) => state.cart);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    triggerSelectionHaptic();
    try {
      await cartService.updateQuantity(productId, newQuantity);
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    triggerErrorHaptic();
    Alert.alert(
      t('cart.removeItem'),
      `${t('cart.removeItem')} ${productName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.removeFromCart(productId);
              dispatch(removeFromCart(productId));
            } catch (error) {
              console.error('Failed to remove item:', error);
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    triggerErrorHaptic();
    Alert.alert(
      t('cart.clearCart'),
      t('cart.clearCartConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.clearCart();
              dispatch(clearCart());
            } catch (error) {
              console.error('Failed to clear cart:', error);
            }
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <TouchableOpacity onPress={() => {
            triggerHaptic();
            navigation.goBack();
          }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>{t('cart.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon={<Ionicons name="cart" size={40} color="#4CAF50" />}
          title={t('cart.empty')}
          description={t('cart.emptyDescription')}
          iconBackgroundColor="#E8F5E9"
          gradientColors={['#4CAF50', '#81C784']}
          action={
            <Button
              title={t('cart.browseProducts')}
              onPress={() => navigation.goBack()}
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => {
          triggerHaptic();
          navigation.goBack();
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>{t('cart.title')}</Text>
        <TouchableOpacity 
          style={[styles.clearButtonContainer, { backgroundColor: isDark ? 'rgba(239,83,80,0.15)' : '#FFF0F0' }]}
          onPress={handleClearCart}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.clearButton}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Items Count Header */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
        </Text>

        {/* Cart Items Card */}
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const product = item.product;
            const hasBulkDiscount = product.bulkDiscountQuantity && product.bulkDiscountPercent;
            const qualifiesForBulkDiscount = hasBulkDiscount && item.quantity >= (product.bulkDiscountQuantity || 0);
            const bulkDiscountSavings = qualifiesForBulkDiscount 
              ? Math.round((Number(product.price) * item.quantity * (product.bulkDiscountPercent || 0)) / 100)
              : 0;
            const unitsNeededForDiscount = hasBulkDiscount && !qualifiesForBulkDiscount
              ? (product.bulkDiscountQuantity || 0) - item.quantity
              : 0;
            
            return (
              <View 
                key={item.productId} 
                style={[
                  styles.cartItem,
                  !isLast && styles.cartItemBorder,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }
                ]}
              >
                {getFirstValidImageUrl(item.product.images) ? (
                  <Image
                    source={{ uri: getFirstValidImageUrl(item.product.images)! }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder, { backgroundColor: isDark ? colors.surface : '#E8F5E9' }]}>
                    <Ionicons name="leaf" size={28} color={colors.primary} />
                  </View>
                )}
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                      {item.product.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.productId, item.product.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                    ₦{Number(item.product.price || 0).toLocaleString()}/{item.product.unit || 'unit'}
                  </Text>
                  
                  {/* Bulk Discount Badge */}
                  {hasBulkDiscount && (
                    <View style={[
                      styles.bulkDiscountBadge, 
                      { backgroundColor: qualifiesForBulkDiscount ? '#E8F5E9' : '#FFF8E1' }
                    ]}>
                      <Ionicons 
                        name={qualifiesForBulkDiscount ? "checkmark-circle" : "pricetag"} 
                        size={14} 
                        color={qualifiesForBulkDiscount ? '#34C759' : '#EAB308'} 
                      />
                      <Text style={[
                        styles.bulkDiscountText,
                        { color: qualifiesForBulkDiscount ? '#34C759' : '#92400E' }
                      ]}>
                        {qualifiesForBulkDiscount 
                          ? `${product.bulkDiscountPercent}% off applied! Save ₦${bulkDiscountSavings.toLocaleString()}`
                          : `Add ${unitsNeededForDiscount} more for ${product.bulkDiscountPercent}% off`
                        }
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.quantityRow}>
                    <View style={[styles.quantitySelector, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Ionicons 
                          name="remove" 
                          size={18} 
                          color={item.quantity <= 1 ? colors.textSecondary : colors.primary} 
                        />
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= (item.product.stock || 0)}
                      >
                        <Ionicons 
                          name="add" 
                          size={18} 
                          color={item.quantity >= (item.product.stock || 0) ? colors.textSecondary : colors.primary} 
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.priceColumn}>
                      {qualifiesForBulkDiscount && (
                        <Text style={styles.originalPrice}>
                          ₦{Number(item.subtotal || 0).toLocaleString()}
                        </Text>
                      )}
                      <Text style={[styles.subtotal, { color: colors.primary }]}>
                        ₦{Number((item.subtotal || 0) - bulkDiscountSavings).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Summary */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('cart.orderSummary')}</Text>
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.subtotal')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦{Number(total || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.deliveryFee')}</Text>
            <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>{t('cart.calculatedAtCheckout')}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('cart.total')}</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>₦{Number(total || 0).toLocaleString()}</Text>
        </View>
        <Button
          title={t('cart.checkout')}
          onPress={() => navigation.navigate('Checkout')}
          style={styles.checkoutButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fixedHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearButton: {
    fontSize: 13,
    color: COLORS.error,
    fontFamily: FONTS.semiBold,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
    marginTop: 16,
  },
  insetCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
  },
  cartItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
    marginBottom: 4,
  },
  bulkDiscountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  bulkDiscountText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    minWidth: 32,
    textAlign: 'center',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  subtotal: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalContainer: {
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  checkoutButton: {
    flex: 1,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import couponService, { Coupon, CouponValidationResult, CartItem } from '../../services/couponService';

interface CouponInputProps {
  subtotal: number;
  deliveryFee?: number;
  cartItems: CartItem[];
  onApplyCoupon: (result: CouponValidationResult) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: Coupon | null;
}

const CouponInput: React.FC<CouponInputProps> = ({
  subtotal,
  deliveryFee = 0,
  cartItems,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await couponService.validateCoupon(
        couponCode.trim().toUpperCase(),
        subtotal,
        cartItems
      );

      if (result.valid) {
        onApplyCoupon(result);
        setCouponCode('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const coupons = await couponService.getAvailableCoupons();
      setAvailableCoupons(coupons);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleShowCoupons = () => {
    setShowAvailableCoupons(true);
    loadAvailableCoupons();
  };

  const handleSelectCoupon = async (coupon: Coupon) => {
    setShowAvailableCoupons(false);
    setCouponCode(coupon.code);
    
    // Auto-apply the selected coupon
    setLoading(true);
    setError(null);

    try {
      const result = await couponService.validateCoupon(
        coupon.code,
        subtotal,
        cartItems
      );

      if (result.valid) {
        onApplyCoupon(result);
        setCouponCode('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const renderCouponItem = ({ item }: { item: Coupon }) => {
    const isExpiringSoon = couponService.isExpiringSoon(item);
    const discount = couponService.calculateDiscount(item, subtotal, deliveryFee);

    return (
      <TouchableOpacity
        style={styles.couponItem}
        onPress={() => handleSelectCoupon(item)}
      >
        <View style={styles.couponLeft}>
          <View style={[styles.couponBadge, isExpiringSoon && styles.expiringBadge]}>
            <Text style={styles.couponBadgeText}>
              {couponService.formatCouponValue(item)}
            </Text>
          </View>
          {isExpiringSoon && (
            <View style={styles.expiringTag}>
              <Ionicons name="time-outline" size={12} color="#F59E0B" />
              <Text style={styles.expiringText}>Expiring soon</Text>
            </View>
          )}
        </View>
        <View style={styles.couponRight}>
          <Text style={styles.couponName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.couponDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.minOrderAmount && (
            <Text style={styles.couponCondition}>
              Min. order: ₦{item.minOrderAmount.toLocaleString()}
            </Text>
          )}
          <Text style={styles.couponExpiry}>
            {couponService.formatExpiryDate(item)}
          </Text>
          {subtotal >= (item.minOrderAmount || 0) && (
            <Text style={styles.savings}>
              You'll save: ₦{discount.discountAmount.toLocaleString()}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (appliedCoupon) {
    const discount = couponService.calculateDiscount(appliedCoupon, subtotal, deliveryFee);
    
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedInfo}>
          <View style={styles.appliedHeader}>
            <Ionicons name="pricetag" size={20} color="#10B981" />
            <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
          </View>
          <Text style={styles.appliedDiscount}>
            -{couponService.formatCouponValue(appliedCoupon)} (₦{discount.discountAmount.toLocaleString()})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemoveCoupon}
        >
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="pricetag-outline" size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter coupon code"
          placeholderTextColor="#9CA3AF"
          value={couponCode}
          onChangeText={(text) => {
            setCouponCode(text.toUpperCase());
            setError(null);
          }}
          autoCapitalize="characters"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.applyButton, !couponCode.trim() && styles.applyButtonDisabled]}
          onPress={handleApplyCoupon}
          disabled={loading || !couponCode.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.viewCouponsButton}
        onPress={handleShowCoupons}
      >
        <Ionicons name="gift-outline" size={18} color="#4F46E5" />
        <Text style={styles.viewCouponsText}>View available coupons</Text>
        <Ionicons name="chevron-forward" size={18} color="#4F46E5" />
      </TouchableOpacity>

      <Modal
        visible={showAvailableCoupons}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAvailableCoupons(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Coupons</Text>
            <TouchableOpacity
              onPress={() => setShowAvailableCoupons(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {loadingCoupons ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading coupons...</Text>
            </View>
          ) : availableCoupons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No coupons available</Text>
              <Text style={styles.emptyText}>
                Check back later for special offers and discounts!
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableCoupons}
              renderItem={renderCouponItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.couponsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  applyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginLeft: 4,
  },
  viewCouponsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  viewCouponsText: {
    color: '#4F46E5',
    fontWeight: '500',
    fontSize: 14,
    marginHorizontal: 6,
  },
  appliedContainer: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  appliedInfo: {
    flex: 1,
  },
  appliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appliedCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 8,
  },
  appliedDiscount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  couponsList: {
    padding: 16,
  },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  couponLeft: {
    marginRight: 12,
  },
  couponBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expiringBadge: {
    backgroundColor: '#F59E0B',
  },
  couponBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  expiringTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  expiringText: {
    fontSize: 10,
    color: '#F59E0B',
    marginLeft: 4,
  },
  couponRight: {
    flex: 1,
  },
  couponName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  couponCondition: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  couponExpiry: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  savings: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default CouponInput;

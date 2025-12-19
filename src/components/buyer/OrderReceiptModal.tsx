import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

interface OrderReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order;
}

export default function OrderReceiptModal({
  visible,
  onClose,
  order,
}: OrderReceiptModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [logoBase64, setLogoBase64] = useState<string>('');

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const asset = Asset.fromModule(require('../../../assets/icon.png'));
      await asset.downloadAsync();
      if (asset.localUri) {
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: 'base64',
        });
        setLogoBase64(`data:image/png;base64,${base64}`);
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateReceiptHTML = () => {
    const itemsHTML = (order.items || []).map((item, index) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333333;">
          <b>${item.title || item.productName || 'Item'}</b><br/>
          <span style="color: #666666; font-size: 12px;">${item.quantity} x NGN ${Number(item.price || 0).toLocaleString()} per ${item.unit || 'unit'}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #333333; font-weight: bold;">NGN ${Number(item.subtotal || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const statusLabels: Record<string, string> = {
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
      in_transit: 'IN TRANSIT',
      picked_up: 'PICKED UP',
      preparing: 'PREPARING',
      confirmed: 'CONFIRMED',
      pending: 'PENDING',
    };
    const statusLabel = statusLabels[order.status] || 'PENDING';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Receipt</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Green Header with Logo -->
    <tr>
      <td style="background-color: #4CAF50; padding: 30px; text-align: center;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Handwork Logo" width="70" height="70" style="border-radius: 12px; margin-bottom: 10px;" />` : ''}
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">HANDWORK</h1>
        <p style="color: #ffffff; margin: 5px 0 20px 0; font-size: 14px;">Fresh Farm Produce, Delivered</p>
        <table cellpadding="10" cellspacing="0" border="0" style="margin: 0 auto; background-color: #3d8b40;">
          <tr>
            <td style="text-align: center;">
              <span style="color: #ffffff; font-size: 11px; text-transform: uppercase;">Order Number</span><br/>
              <b style="color: #ffffff; font-size: 22px;">#${order.orderNumber || order.id?.slice(-8) || 'N/A'}</b>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Status Row -->
    <tr>
      <td style="background-color: #e8f5e9; padding: 15px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color: #2e7d32; font-weight: bold; font-size: 14px;">${statusLabel}</td>
            <td style="color: #2e7d32; font-size: 12px; text-align: right;">${formattedDate}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 30px;">
        
        <!-- Order Details -->
        <h3 style="color: #333333; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Order Details</h3>
        <table width="100%" cellpadding="8" cellspacing="0" border="0" style="margin-bottom: 25px;">
          <tr>
            <td style="color: #666666;">Order Time:</td>
            <td style="color: #333333; text-align: right; font-weight: bold;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="color: #666666;">Payment Method:</td>
            <td style="color: #333333; text-align: right; font-weight: bold;">${order.paymentMethod || 'Card Payment'}</td>
          </tr>
          ${order.farmerName ? `
          <tr>
            <td style="color: #666666;">Farmer:</td>
            <td style="color: #333333; text-align: right; font-weight: bold;">${order.farmerName}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Delivery Address -->
        <h3 style="color: #333333; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Delivery Address</h3>
        <p style="color: #333333; margin: 0 0 5px 0; font-weight: bold;">${order.deliveryAddress?.address || 'N/A'}</p>
        <p style="color: #666666; margin: 0 0 25px 0;">${order.deliveryAddress?.city || ''}${order.deliveryAddress?.city && order.deliveryAddress?.state ? ', ' : ''}${order.deliveryAddress?.state || ''}</p>

        <!-- Order Items -->
        <h3 style="color: #333333; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Order Items (${order.items?.length || 0})</h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; color: #333333; font-size: 11px; text-transform: uppercase;">Item</th>
            <th style="padding: 10px; text-align: right; color: #333333; font-size: 11px; text-transform: uppercase;">Amount</th>
          </tr>
          ${itemsHTML}
        </table>

        <!-- Payment Summary -->
        <h3 style="color: #333333; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Payment Summary</h3>
        <table width="100%" cellpadding="8" cellspacing="0" border="0">
          <tr>
            <td style="color: #666666;">Subtotal:</td>
            <td style="color: #333333; text-align: right;">NGN ${Number(order.subtotal || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: #666666;">Delivery Fee:</td>
            <td style="color: #333333; text-align: right;">NGN ${Number(order.deliveryFee || 0).toLocaleString()}</td>
          </tr>
          ${order.serviceFee ? `
          <tr>
            <td style="color: #666666;">Service Fee:</td>
            <td style="color: #333333; text-align: right;">NGN ${Number(order.serviceFee).toLocaleString()}</td>
          </tr>
          ` : ''}
          ${order.discount ? `
          <tr>
            <td style="color: #666666;">Discount:</td>
            <td style="color: #4CAF50; text-align: right;">-NGN ${Number(order.discount).toLocaleString()}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="padding-top: 15px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 2px solid #333333; padding-top: 15px;">
                <tr>
                  <td style="color: #333333; font-size: 18px; font-weight: bold;">TOTAL:</td>
                  <td style="color: #4CAF50; font-size: 22px; font-weight: bold; text-align: right;">NGN ${Number(order.total || 0).toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9f9f9; padding: 25px; text-align: center; border-top: 1px dashed #dddddd;">
        <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Thank you for your order!</p>
        <p style="color: #666666; font-size: 12px; margin: 0 0 5px 0;">Questions? Contact our support team</p>
        <p style="color: #4CAF50; font-size: 12px; font-weight: bold; margin: 0;">support@handwork.com</p>
      </td>
    </tr>

  </table>
</body>
</html>
    `;
  };

  const handleShareText = async () => {
    const items = (order.items || [])
      .map(item => `• ${item.title || item.productName} x${item.quantity} - ₦${Number(item.subtotal).toLocaleString()}`)
      .join('\n');

    const message = `
🌿 Handwork Order Receipt

Order #${order.orderNumber || order.id?.slice(-8)}
Date: ${formatDate(order.createdAt)}

Items:
${items}

Subtotal: ₦${Number(order.subtotal || 0).toLocaleString()}
Delivery: ₦${Number(order.deliveryFee || 0).toLocaleString()}
${order.discount ? `Discount: -₦${Number(order.discount).toLocaleString()}\n` : ''}Total: ₦${Number(order.total || 0).toLocaleString()}

Delivery Address:
${order.deliveryAddress?.address || 'N/A'}
${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''}

Thank you for shopping with Handwork!
    `.trim();

    try {
      await Share.share({
        message,
        title: `Order Receipt #${order.orderNumber || order.id?.slice(-8)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Order Receipt #${order.orderNumber || order.id?.slice(-8)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Receipt saved successfully');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateReceiptHTML();
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print receipt. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[
          styles.container,
          { 
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            paddingBottom: insets.bottom + 16,
          }
        ]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Order Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Order Info */}
            <View style={[styles.receiptCard, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
              <View style={styles.receiptHeader}>
                <Text style={[styles.logoText, { color: colors.primary }]}>🌿 Handwork</Text>
                <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>
                  #{order.orderNumber || order.id?.slice(-8)}
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>{formatDate(order.createdAt)}</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Status</Text>
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: order.status === 'delivered' ? '#E8F5E9' : 
                      order.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0'
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    {
                      color: order.status === 'delivered' ? '#2E7D32' : 
                        order.status === 'cancelled' ? '#C62828' : '#E65100'
                    }
                  ]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              {/* Items */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ITEMS</Text>
              {(order.items || []).map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.title || item.productName || 'Item'} x{item.quantity}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    ₦{Number(item.subtotal || 0).toLocaleString()}
                  </Text>
                </View>
              ))}

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

              {/* Totals */}
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  ₦{Number(order.subtotal || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  ₦{Number(order.deliveryFee || 0).toLocaleString()}
                </Text>
              </View>
              {(order.serviceFee || 0) > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Service Fee</Text>
                  <Text style={[styles.receiptValue, { color: colors.text }]}>
                    ₦{Number(order.serviceFee).toLocaleString()}
                  </Text>
                </View>
              )}
              {(order.discount || 0) > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Discount</Text>
                  <Text style={[styles.receiptValue, { color: '#4CAF50' }]}>
                    -₦{Number(order.discount).toLocaleString()}
                  </Text>
                </View>
              )}

              <View style={[styles.totalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  ₦{Number(order.total || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View style={[styles.addressCard, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DELIVERY ADDRESS</Text>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {order.deliveryAddress?.address || 'N/A'}
              </Text>
              <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                {order.deliveryAddress?.city || ''}, {order.deliveryAddress?.state || ''}
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={handleShareText}
            >
              <Ionicons name="share-outline" size={22} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={handleDownloadPDF}
            >
              <Ionicons name="download-outline" size={22} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={handlePrint}
            >
              <Ionicons name="print-outline" size={22} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Print</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  receiptCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  addressCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});

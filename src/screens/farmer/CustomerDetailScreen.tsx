import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FarmerStackParamList } from '../../types';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<FarmerStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route, navigation }: Props) {
  const { customerId, customerName, customerPhone, customerAvatar } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Fetch customer's order history from this farmer (from backend API)
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: async () => {
      // Fetches all farmer orders from /orders API endpoint, then filters by customer
      const result = await orderService.getOrders({ page: 1, limit: 100 });
      // Handle various response formats
      let allOrders: any[] = [];
      if (Array.isArray(result)) {
        allOrders = result;
      } else if ((result as any)?.data?.data) {
        allOrders = (result as any).data.data;
      } else if ((result as any)?.data) {
        allOrders = Array.isArray((result as any).data) ? (result as any).data : [];
      } else if ((result as any)?.orders) {
        allOrders = (result as any).orders;
      }
      // Filter by customer ID
      return allOrders.filter((order: any) => 
        order.buyer?.id === customerId || 
        order.buyerId === customerId ||
        order.buyer?.id?.toString() === customerId?.toString() ||
        order.buyerId?.toString() === customerId?.toString()
      );
    },
    enabled: !!customerId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Calculate stats - ensure orders is an array
  const ordersList = Array.isArray(orders) ? orders : [];
  const totalOrders = ordersList.length;
  const totalSpent = ordersList.reduce((sum: number, order: any) => {
    const amount = Number(order.subtotal) || Number(order.total) || 0;
    return sum + amount;
  }, 0);
  const completedOrders = ordersList.filter((order: any) => order.status === 'delivered').length;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      case 'pending': return '#FF9500';
      case 'confirmed':
      case 'preparing':
      case 'ready_for_pickup': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const handlePrintReceipt = async (order: any) => {
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt #${order.orderNumber || order.id?.slice(-8)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #16A34A;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #16A34A;
            margin: 0;
            font-size: 24px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .label { color: #666; }
          .value { font-weight: 600; }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #16A34A;
            font-size: 18px;
            font-weight: 700;
          }
          .total-value { color: #16A34A; }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: ${getStatusColor(order.status)}20;
            color: ${getStatusColor(order.status)};
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAGKDAGaAAAFgUlEQVRYw7WXa2wUVRTH/20p7fZBW0p5iAplaUELCqEFlUCMYKwJKMYgaEwIUpQYNCIWRYgvQtTS6AeiKEqIQDBIAEFAEEm1DUVUoIqPVqhCC/IoammhC9vt/vywM7szu7NLLfHMl7n3nP/533vuPefMSHap8wNIoG57pxIYSErZDyCgB8qogTYUeKT+v2C+SlLanqA3v4EBwSdAasAI4CUUcA7wRsiBMbDIjQDQd4M0ogimtkrbMWSgAVzibUIouTIwfc4kJaVIkpT+PTxLiGplkHCo6Wq+uSOydlrYl3jD1xOSAQ5zdzcA1CJJK/ygOEk91kIhAMsQmeMDq9MRg7ojGExIINkrOAm8D4DHSg9QwiQApiDmeQzFWaDE2LUQ4DXjedimsAQaShgbqXj4NM4ISZpmVeTbdt6vGISrWtElfs76Fuig9+9hij7qFjbTs6GecEnxSdKa4DjbK0nFrzWFTI4yE/jVsvDsMaauP0JxX0ARviBgOg0A3GnZaVpO4N3llZRYYZrez8dhC/KRxrBVYSt37TPVgSh6GQN8FFxSQPLOqbsBSP3Wy2gLwJIRQcC91mPIOGyaTaTKARBxbllH7EtqZkJsgCRlvrTbF21JQiS3KN7pkFNH/BMOiJ+nq8vQTTNI8ChZnZabXJs7bxzf9zjAO/8kTLfNxynXwTpze6PlnG8/o16B+fzTfqCRgq1W62nXtYff1X1orjRiqzn2M8TgySlqAFjNuqDxFdIRKpWeag/Vo7zfJWXXei1ep3AaKDYDWypNvhLQnETk1+kWf/hC3iUrdGil0i3lAE8iRM/r1cpm3g0aNzAdgB8sACnvm8Bo0AuSLgLwKMeBQjosTEuCAJu0BSPgjsjo5WS0KyUM4Amqf6aO2cFRPUKU0cLAOhvgsgUAUM4u/PQz9lAGwC5/75eDgFlhAHuxKzNmynGtMwDtvMWOmIBahEjbYAACBWYCzY6A18kx3jI2WXolQJvRKMLqb6g5bbO0AnMPlbwSFdBrpwMA4FkOOwJ6mw08q/J8jChZnhtCR9HdfTo2IP6JyGQrfKbVGZBeETWdB723PwzQ/ZISr1IDchs9IcCtnasbWWMvCC3SNUhm2ophJ2raq9pyjycvjbju1yTje/604IzHllMXmH0256BGRBoPTipaO/jv4ktTPaNaC+rd02I5dqUsdTdUXiaGfOYbdKbPi2bnLkjLO3cszGJx+00fRLoemXlg1qkLVDOOxVyM6v4MM4kLlpQh6cObI22OIcatNh0nJj3X/8S2S3aTFhZwJ9/Z5raTZ71npZKUOWVxhPtDuBD5jZI7c+8DJ8/Giga7GcObzCMxMkFKJWlUYm6ztU0cYbihH7lccbv3cw9z+Tuq+yrG8gptNDGHBEcCSXGDjz7NDG6zWQyYLylhTyDSl1nK7VRYHLfxKmOpjCDcaH5dR5T1obPddekel9f95/BPs/ubwa+wB76acTzPRJ6hOWbYGnkEEb/wqlc96eu2CHAJ1cznLg5Fdf8lBQjxBqv87qbcx2MQJFd5HAjMyrSD0bxN6ABbWUiSQ9f4jQnNA7epjwNBSvWVGATmrX+M+xjjUGbLbHbtLLvU7w/dYf/0OrCV0ZTjjUEQ/WOxzJYh+QiRut5GkP6dz/jBms0kartA0ByWIekbbQQ9DnXYHG2gkIJOE7gc5jK32AgyavwOZ/A504N/AjG/px2entvtxf5Hoh5yByspZMN/JMjZbQ/RwRrf1W5RLZMY3Pkd7Ii8q5N71y9rae/CLbI/PY5qfKyk7ttvy13nj3aBIN6XslwZnW2TcX1KMlre8vk7RZB6QsVd7ccD3dUPXTwVhSCuI+lD80fi2iQhb1H+X5ssBEmn9KD+B7k54yut0XX/HfgvpUkmTvPggOsAAAAASUVORK5CYII=" alt="Handwork" style="width: 60px; height: 60px; margin-bottom: 10px; border-radius: 12px;" />
          <h1>Handwork</h1>
          <p>Order Receipt</p>
        </div>
        <div class="info-row">
          <span class="label">Order #</span>
          <span class="value">${order.orderNumber || order.id?.slice(-8)}</span>
        </div>
        <div class="info-row">
          <span class="label">Date</span>
          <span class="value">${orderDate}</span>
        </div>
        <div class="info-row">
          <span class="label">Customer</span>
          <span class="value">${customerName || 'Customer'}</span>
        </div>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="status">${order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('_', ' ')}</span>
        </div>
        <div class="info-row">
          <span class="label">Items</span>
          <span class="value">${order.itemCount || order.items?.length || 0}</span>
        </div>
        <div class="total-row">
          <span>Total</span>
          <span class="total-value">₦${(order.subtotal || order.total || 0).toLocaleString()}</span>
        </div>
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Handwork - Fresh Farm Produce</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt #${order.orderNumber || order.id?.slice(-8)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'Receipt generated successfully');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {children.toUpperCase()}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* iOS-style Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Customer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.avatarContainer}>
            {customerAvatar ? (
              <Image source={{ uri: customerAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.avatarText}>
                  {(customerName || 'C')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.customerName, { color: colors.text }]}>{customerName || 'Customer'}</Text>
          {customerPhone && (
            <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{customerPhone}</Text>
          )}
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{totalOrders}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>₦{totalSpent.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Spent</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{completedOrders}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BuyerChat', {
              buyerId: customerId,
              buyerName: customerName || 'Customer',
              buyerPhone: customerPhone,
              buyerAvatar: customerAvatar,
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#007AFF15' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                  fill="#007AFF"
                />
                <Circle cx="8" cy="10" r="1.5" fill="white" />
                <Circle cx="12" cy="10" r="1.5" fill="white" />
                <Circle cx="16" cy="10" r="1.5" fill="white" />
              </Svg>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Message</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Send a message</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'} />
          </TouchableOpacity>
          
          {customerPhone && (
            <>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C6C6C8', marginLeft: 60 }]} />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${customerPhone}`)}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#34C75915' }]}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20.01 15.38C18.78 15.38 17.59 15.18 16.48 14.82C16.13 14.7 15.74 14.79 15.47 15.06L13.9 17.03C11.07 15.68 8.42 13.13 7.01 10.2L8.96 8.54C9.23 8.26 9.31 7.87 9.2 7.52C8.83 6.41 8.64 5.22 8.64 3.99C8.64 3.45 8.19 3 7.65 3H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21C20.72 21 21 20.37 21 19.82V16.37C21 15.83 20.55 15.38 20.01 15.38Z"
                      fill="#34C759"
                    />
                  </Svg>
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Call</Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{customerPhone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Order History */}
        <SectionLabel>Order History</SectionLabel>
        <View style={[styles.ordersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : orders && orders.length > 0 ? (
            orders.map((order: any, index: number) => (
              <React.Fragment key={order.id}>
                {index > 0 && (
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C6C6C8', marginLeft: 16 }]} />
                )}
                <View style={styles.orderRow}>
                  <TouchableOpacity
                    style={styles.orderContent}
                    onPress={() => navigation.navigate('FarmerOrderDetail', { orderId: order.id })}
                    onLongPress={() => handlePrintReceipt(order)}
                    delayLongPress={500}
                  >
                    <View style={styles.orderInfo}>
                      <Text style={[styles.orderNumber, { color: colors.text }]}>
                        #{order.orderNumber || order.id?.slice(-6)}
                      </Text>
                      <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.orderMeta}>
                      <Text style={[styles.orderAmount, { color: colors.text }]}>
                        ₦{(order.subtotal || order.total || 0).toLocaleString()}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptButton}
                    onPress={() => handlePrintReceipt(order)}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                        stroke="#007AFF"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M8 6h8M8 10h8M8 14h4"
                        stroke="#007AFF"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: SPACING.xxl + insets.bottom }} />
      </ScrollView>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 44,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Profile Card
  profileCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.small,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  
  // Actions Card
  actionsCard: {
    borderRadius: 10,
    marginTop: 24,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  
  // Section Label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: -0.08,
    marginBottom: 8,
    marginTop: 24,
  },
  
  // Orders Card
  ordersCard: {
    borderRadius: 10,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  orderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptButton: {
    padding: 8,
    marginLeft: 8,
  },
  chevronButton: {
    paddingLeft: 4,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 17,
    fontFamily: FONTS.medium,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  orderAmount: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginTop: 8,
  },
});

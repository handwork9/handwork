import * as Linking from 'expo-linking';
import { LinkingOptions } from '@react-navigation/native';

// Deep link configuration for the app
export const linking: LinkingOptions<any> = {
  prefixes: [
    Linking.createURL('/'),
    'handwork://',
    'https://handwork.ng',
    'https://www.handwork.ng',
  ],
  config: {
    screens: {
      // Auth screens
      Auth: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
          ForgotPassword: 'forgot-password',
        },
      },
      // Buyer screens
      Main: {
        screens: {
          BuyerTabs: {
            screens: {
              Home: 'home',
              Search: 'search',
              Orders: 'orders',
              Profile: 'profile',
            },
          },
          ProductDetail: {
            path: 'product/:productId',
            parse: {
              productId: (id: string) => id,
            },
          },
          FarmerProfile: {
            path: 'farmer/:farmerId',
            parse: {
              farmerId: (id: string) => id,
            },
          },
          OrderDetail: {
            path: 'order/:orderId',
            parse: {
              orderId: (id: string) => id,
            },
          },
          FlashSaleDetail: {
            path: 'flash-sale/:saleId',
            parse: {
              saleId: (id: string) => id,
            },
          },
          // Social screens
          SocialFeed: 'community',
          PostDetail: {
            path: 'post/:postId',
            parse: {
              postId: (id: string) => id,
            },
          },
          // Referral
          Invite: {
            path: 'invite/:referralCode',
            parse: {
              referralCode: (code: string) => code,
            },
          },
        },
      },
      // Farmer screens
      FarmerMain: {
        screens: {
          FarmerTabs: {
            screens: {
              Dashboard: 'farmer/dashboard',
              Products: 'farmer/products',
              Orders: 'farmer/orders',
              Profile: 'farmer/profile',
            },
          },
        },
      },
    },
  },
};

// Generate shareable links
export const generateProductLink = (productId: string, productTitle?: string): string => {
  const slug = productTitle 
    ? productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';
  return `https://handwork.ng/product/${productId}${slug ? `?title=${encodeURIComponent(slug)}` : ''}`;
};

export const generateFarmerLink = (farmerId: string, farmerName?: string): string => {
  const slug = farmerName 
    ? farmerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';
  return `https://handwork.ng/farmer/${farmerId}${slug ? `?name=${encodeURIComponent(slug)}` : ''}`;
};

export const generatePostLink = (postId: string): string => {
  return `https://handwork.ng/post/${postId}`;
};

export const generateFlashSaleLink = (saleId: string): string => {
  return `https://handwork.ng/flash-sale/${saleId}`;
};

export const generateInviteLink = (referralCode: string): string => {
  return `https://handwork.ng/invite/${referralCode}`;
};

export const generateOrderLink = (orderId: string): string => {
  return `https://handwork.ng/order/${orderId}`;
};

// Parse incoming deep links
export const parseDeepLink = (url: string): { screen: string; params: Record<string, string> } | null => {
  try {
    const parsed = Linking.parse(url);
    const pathParts = parsed.path?.split('/').filter(Boolean) || [];
    
    if (pathParts.length === 0) return null;

    const type = pathParts[0];
    const id = pathParts[1];

    switch (type) {
      case 'product':
        return { screen: 'ProductDetail', params: { productId: id } };
      case 'farmer':
        return { screen: 'FarmerProfile', params: { farmerId: id } };
      case 'post':
        return { screen: 'PostDetail', params: { postId: id } };
      case 'flash-sale':
        return { screen: 'FlashSaleDetail', params: { saleId: id } };
      case 'invite':
        return { screen: 'Invite', params: { referralCode: id } };
      case 'order':
        return { screen: 'OrderDetail', params: { orderId: id } };
      default:
        return null;
    }
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

// Hook to handle incoming deep links
export const useDeepLinkHandler = (navigation: any) => {
  const handleDeepLink = async (event: { url: string }) => {
    const parsed = parseDeepLink(event.url);
    if (parsed) {
      navigation.navigate(parsed.screen, parsed.params);
    }
  };

  return handleDeepLink;
};

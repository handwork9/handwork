import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

interface StatusCommunityCardProps {
  storiesCount?: number;
  liveCount?: number;
  style?: object;
}

const StatusCommunityCard: React.FC<StatusCommunityCardProps> = ({
  storiesCount = 0,
  liveCount = 0,
  style,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const handleStatusPress = () => {
    triggerHaptic();
    (navigation as any).navigate('Social');
  };

  const handleCommunityPress = () => {
    triggerHaptic();
    (navigation as any).navigate('Community');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 8,
          elevation: isDark ? 0 : 3,
        },
        style,
      ]}
    >
      {/* Status Row */}
      <TouchableOpacity
        style={styles.row}
        onPress={handleStatusPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isDark ? ['#7C3AED', '#6D28D9'] : ['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <MaterialCommunityIcons name="camera-iris" size={20} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Status</Text>
          <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
            {storiesCount > 0 ? `${storiesCount} new updates` : 'View farmer stories'}
          </Text>
        </View>
        {storiesCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{storiesCount > 99 ? '99+' : storiesCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

      {/* Community Row */}
      <TouchableOpacity
        style={styles.row}
        onPress={handleCommunityPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isDark ? ['#059669', '#047857'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Community</Text>
          <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
            Connect with farmers
          </Text>
        </View>
        {liveCount > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{liveCount} Live</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    marginRight: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});

export default StatusCommunityCard;

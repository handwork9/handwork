import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Vibration,
} from 'react-native';
import { BarCodeScanner, BarCodeScannedCallback } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string, type: string) => void;
  title?: string;
  description?: string;
}

export default function QRCodeScanner({
  visible,
  onClose,
  onScan,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code to scan',
}: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      requestPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access to scan QR codes.',
        [
          { text: 'Cancel', style: 'cancel', onPress: onClose },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleBarCodeScanned: BarCodeScannedCallback = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    triggerHaptic();
    Vibration.vibrate(100);
    
    onScan(data, type);
  };

  const handleRescan = () => {
    setScanned(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {hasPermission === null ? (
          <View style={styles.centeredContent}>
            <Text style={[styles.permissionText, { color: colors.text }]}>
              Requesting camera permission...
            </Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centeredContent}>
            <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.permissionText, { color: colors.text }]}>
              Camera permission is required
            </Text>
            <TouchableOpacity 
              style={[styles.settingsButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barCodeTypes={[
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
                BarCodeScanner.Constants.BarCodeType.upc_a,
                BarCodeScanner.Constants.BarCodeType.upc_e,
              ]}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
              {/* Top overlay */}
              <View style={[styles.overlaySection, { height: (height - SCAN_AREA_SIZE) / 2 - 50 }]} />
              
              {/* Middle section with scan area */}
              <View style={styles.middleSection}>
                <View style={styles.overlaySection} />
                
                {/* Scan area */}
                <View style={styles.scanArea}>
                  {/* Corner decorations */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  
                  {/* Scanning line animation */}
                  {!scanned && (
                    <View style={styles.scanLineContainer}>
                      <LinearGradient
                        colors={['transparent', colors.primary, 'transparent']}
                        style={styles.scanLine}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                  )}
                </View>
                
                <View style={styles.overlaySection} />
              </View>
              
              {/* Bottom overlay */}
              <View style={[styles.overlaySection, { height: (height - SCAN_AREA_SIZE) / 2 + 50 }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>{title}</Text>
              
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setTorchOn(!torchOn)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={torchOn ? 'flash' : 'flash-outline'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Bottom controls */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
              {scanned ? (
                <TouchableOpacity 
                  style={[styles.rescanButton, { backgroundColor: colors.primary }]}
                  onPress={handleRescan}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.rescanText}>Scan Again</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.scanHint}>
                  <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.scanHintText}>
                    Position the QR code within the frame
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  settingsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleSection: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanLineContainer: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 2,
  },
  scanLine: {
    flex: 1,
    height: 2,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  descriptionContainer: {
    position: 'absolute',
    top: height / 2 - SCAN_AREA_SIZE / 2 - 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  rescanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  scanHintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
});

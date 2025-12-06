import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { getLocationColor } from '../utils/colors';
import { formatDate, isToday } from '../utils/dateUtils';
import { COLORS, PHONE_NUMBER, PHONE_DISPLAY } from '../constants/config';
import type { Checkpoint } from '../types/checkpoint';

interface CheckpointDetailModalProps {
  visible: boolean;
  checkpoint: Checkpoint | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

const CheckpointDetailModal: React.FC<CheckpointDetailModalProps> = ({
  visible,
  checkpoint,
  onClose,
}) => {
  const translateY = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      // Reset to starting position when opening
      translateY.setValue(0);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: MODAL_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [visible]);

  const handlePan = Gesture.Pan()
    .activeOffsetY([10, Infinity]) // Only activate when dragging down
    .failOffsetX([-30, 30]) // Fail if horizontal movement (allows content scrolling)
    .onUpdate((event) => {
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        translateY.setValue(event.translationY);
      }
    })
    .onEnd((event) => {
      const threshold = MODAL_HEIGHT * 0.3; // Close if dragged down 30% of modal height
      if (event.translationY > threshold || event.velocityY > 500) {
        // Close modal
        Animated.timing(translateY, {
          toValue: MODAL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          translateY.setValue(MODAL_HEIGHT);
          onClose();
        });
      } else {
        // Snap back to open position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    });

  if (!checkpoint) return null;

  const color = getLocationColor(checkpoint.County);
  const today = isToday(checkpoint.Date);

  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleSource = () => {
    if (checkpoint.Source) {
      Linking.openURL(checkpoint.Source);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <GestureHandlerRootView style={styles.modalContainer}>
          <GestureDetector gesture={handlePan}>
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Color Bar */}
              <View style={[styles.colorBar, { backgroundColor: color }]} />

              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>
                      {checkpoint.City || 'Unknown City'}
                    </Text>
                    {today && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.county, { color }]}>
                    {checkpoint.County || ''}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
              >
                {/* Location */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {checkpoint.Location || 'Location not disclosed'}
                  </Text>
                </View>

                {/* Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(checkpoint.Date)}
                  </Text>
                </View>

                {/* Time */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {checkpoint.Time || 'Time not specified'}
                  </Text>
                </View>

                {/* Description */}
                {checkpoint.Description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Details</Text>
                    <Text style={styles.detailValue}>
                      {checkpoint.Description}
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                {checkpoint.Source && (
                  <TouchableOpacity
                    style={styles.sourceButton}
                    onPress={handleSource}
                  >
                    <Text style={styles.sourceButtonText}>View Source</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCall}
                >
                  <Text style={styles.callButtonText}>Get Help</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
  },
  modal: {
    height: MODAL_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  colorBar: {
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  todayBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  county: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  sourceButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  callButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default CheckpointDetailModal;


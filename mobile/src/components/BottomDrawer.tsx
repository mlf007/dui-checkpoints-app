import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import CheckpointList from './CheckpointList';
import { COLORS, PHONE_NUMBER, PHONE_DISPLAY } from '../constants/config';
import * as Linking from 'expo-linking';
import type { Checkpoint } from '../types/checkpoint';

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  checkpoints: Checkpoint[];
  selectedCheckpoint: Checkpoint | null;
  onSelectCheckpoint: (checkpoint: Checkpoint) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMode: 'upcoming' | 'all';
  onFilterChange: (mode: 'upcoming' | 'all') => void;
  loading: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  visible,
  onClose,
  checkpoints,
  selectedCheckpoint,
  onSelectCheckpoint,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  loading,
}) => {
  const translateY = React.useRef(new Animated.Value(DRAWER_HEIGHT)).current;

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
        toValue: DRAWER_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [visible]);

  // Only allow drag on handle area, not on scrollable content
  // Use activeOffsetY to only trigger when dragging down from handle
  // Use failOffsetX to prevent horizontal swipes from triggering
  const handlePan = Gesture.Pan()
    .activeOffsetY([10, Infinity]) // Only activate when dragging down
    .failOffsetX([-30, 30]) // Fail if horizontal movement is too much (allows list scrolling)
    .onUpdate((event) => {
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        translateY.setValue(event.translationY);
      }
    })
    .onEnd((event) => {
      const threshold = DRAWER_HEIGHT * 0.3; // Close if dragged down 30% of drawer height
      if (event.translationY > threshold || event.velocityY > 500) {
        // Close drawer
        Animated.timing(translateY, {
          toValue: DRAWER_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          translateY.setValue(DRAWER_HEIGHT);
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

  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
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
        <GestureHandlerRootView style={styles.drawerContainer}>
          <GestureDetector gesture={handlePan}>
            <Animated.View
              style={[
                styles.drawer,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Handle - Drag indicator */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>DUI Checkpoints</Text>
                  <Text style={styles.headerSubtitle}>
                    {checkpoints.length} locations found
                  </Text>
                </View>
              </View>

              {/* Search & Filters */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search city, county..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={onSearchChange}
                />
                <View style={styles.filterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      filterMode === 'upcoming' && styles.filterButtonActive,
                    ]}
                    onPress={() => onFilterChange('upcoming')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterMode === 'upcoming' && styles.filterButtonTextActive,
                      ]}
                    >
                      Upcoming
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      filterMode === 'all' && styles.filterButtonActive,
                    ]}
                    onPress={() => onFilterChange('all')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterMode === 'all' && styles.filterButtonTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* List - Scrollable area */}
              <View style={styles.listContainer} pointerEvents="box-none">
                <CheckpointList
                  checkpoints={checkpoints}
                  selectedCheckpoint={selectedCheckpoint}
                  onSelectCheckpoint={(checkpoint) => {
                    onSelectCheckpoint(checkpoint);
                    onClose();
                  }}
                  loading={loading}
                />
              </View>

              {/* CTA Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerTitle}>
                  Got stopped at a checkpoint?
                </Text>
                <Text style={styles.footerSubtitle}>
                  The Meehan Law Firm is here to help 24/7
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCall}
                >
                  <Text style={styles.callButtonText}>{PHONE_DISPLAY}</Text>
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
  drawerContainer: {
    height: DRAWER_HEIGHT,
  },
  drawer: {
    height: DRAWER_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  callButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BottomDrawer;


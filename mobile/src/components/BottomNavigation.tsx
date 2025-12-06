import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { COLORS, PHONE_NUMBER, PHONE_DISPLAY } from '../constants/config';

interface BottomNavigationProps {
  onLocatePress: () => void;
  onListPress: () => void;
  isLocating: boolean;
  checkpointCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onLocatePress,
  onListPress,
  isLocating,
  checkpointCount,
}) => {
  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {/* Locate Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onLocatePress}
          disabled={isLocating}
        >
          <View style={[styles.iconCircle, isLocating && styles.iconCircleActive]}>
            <Text style={styles.iconText}>📍</Text>
          </View>
          <Text style={styles.navButtonText}>Locate</Text>
        </TouchableOpacity>

        {/* Plus Button (Center - Floating) */}
        <TouchableOpacity
          style={styles.plusButton}
          onPress={onListPress}
          activeOpacity={0.8}
        >
          <Text style={styles.plusIcon}>+</Text>
          {checkpointCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {checkpointCount > 99 ? '99+' : checkpointCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Call Button */}
        <TouchableOpacity style={styles.navButton} onPress={handleCall}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📞</Text>
          </View>
          <Text style={styles.navButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconCircleActive: {
    backgroundColor: '#EFF6FF',
  },
  iconText: {
    fontSize: 20,
  },
  navButtonText: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
    position: 'relative',
  },
  plusIcon: {
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BottomNavigation;


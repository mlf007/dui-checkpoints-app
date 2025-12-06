import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Marker, Callout, Marker as MarkerType } from 'react-native-maps';
import Svg, { Path, Circle } from 'react-native-svg';
import { getLocationColor } from '../utils/colors';
import { isToday } from '../utils/dateUtils';
import { COLORS } from '../constants/config';
import type { Checkpoint } from '../types/checkpoint';

interface CheckpointMarkerProps {
  checkpoint: Checkpoint;
  isSelected: boolean;
  onPress: () => void;
  onViewDetails: () => void;
  coordinates: { latitude: number; longitude: number };
}

const CheckpointMarker: React.FC<CheckpointMarkerProps> = ({
  checkpoint,
  isSelected,
  onPress,
  onViewDetails,
  coordinates,
}) => {
  const markerRef = useRef<MarkerType>(null);

  // Show callout when marker is selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Small delay to ensure map has finished animating
      setTimeout(() => {
        markerRef.current?.showCallout();
      }, 500);
    }
  }, [isSelected]);
  const color = getLocationColor(checkpoint.County);
  const today = isToday(checkpoint.Date);
  const size = isSelected ? 44 : 34;

  const PinIcon = () => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <Circle cx="12" cy="8" r="3.5" fill="white" />
    </Svg>
  );

  return (
    <Marker
      ref={markerRef}
      coordinate={coordinates}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={isSelected ? 1000 : 1}
    >
      <View style={[styles.markerContainer, { width: size, height: size }]}>
        <PinIcon />
        {today && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>!</Text>
          </View>
        )}
        {isSelected && (
          <View style={[styles.selectedRing, { borderColor: color }]} />
        )}
      </View>
      <Callout tooltip={false} onPress={onViewDetails}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{checkpoint.City || 'Unknown City'}</Text>
          <Text style={[styles.calloutCounty, { color }]}>{checkpoint.County || ''}</Text>
          <Text style={styles.calloutDate}>{checkpoint.Date || 'Date TBD'}</Text>
          <TouchableOpacity style={styles.calloutButton} onPress={onViewDetails}>
            <Text style={styles.calloutButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  todayBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedRing: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 3,
    top: '50%',
    left: '50%',
    marginTop: -27.5,
    marginLeft: -27.5,
    opacity: 0.5,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  calloutCounty: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  calloutDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  calloutButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CheckpointMarker;


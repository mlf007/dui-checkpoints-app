import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import MapView, { Region, Marker as MapMarker, Polygon, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchCheckpoints } from '../services/api';
import { getLocationColor } from '../utils/colors';
import { isToday, isUpcoming } from '../utils/dateUtils';
import { DEFAULT_MAP_CENTER, DEFAULT_LATITUDE_DELTA, DEFAULT_LONGITUDE_DELTA, LOGO_URL, COLORS } from '../constants/config';
import type { Checkpoint } from '../types/checkpoint';
import CheckpointMarker from '../components/CheckpointMarker';
import BottomDrawer from '../components/BottomDrawer';
import CheckpointDetailModal from '../components/CheckpointDetailModal';
import BottomNavigation from '../components/BottomNavigation';

import { geocodeCheckpoints } from '../utils/geocoding';
import { fetchCityBoundary, convertGeoJSONToPolygon } from '../utils/boundary';

// Helper to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MapScreen: React.FC = () => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [detailCheckpoint, setDetailCheckpoint] = useState<Checkpoint | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [filterMode, setFilterMode] = useState<'upcoming' | 'all'>('all');
  const [mapRegion, setMapRegion] = useState<Region>({
    ...DEFAULT_MAP_CENTER,
    latitudeDelta: DEFAULT_LATITUDE_DELTA,
    longitudeDelta: DEFAULT_LONGITUDE_DELTA,
  });
  const [checkpointCoords, setCheckpointCoords] = useState<Map<string, { latitude: number; longitude: number }>>(new Map());
  const [boundaryPolygon, setBoundaryPolygon] = useState<Array<{ latitude: number; longitude: number }> | null>(null);
  const [boundaryCircle, setBoundaryCircle] = useState<{ center: { latitude: number; longitude: number }; radius: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  // Fetch checkpoints
  useEffect(() => {
    loadCheckpoints();
  }, []);

  const loadCheckpoints = async () => {
    try {
      setLoading(true);
      const response = await fetchCheckpoints();
      if (response.success && response.checkpoints) {
        setCheckpoints(response.checkpoints);
        
        // Geocode all checkpoints in background
        geocodeCheckpointsData(response.checkpoints);
      }
    } catch (error) {
      console.error('Error loading checkpoints:', error);
      Alert.alert('Error', 'Failed to load checkpoints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Geocode checkpoints
  const geocodeCheckpointsData = async (checkpointsToGeocode: Checkpoint[]) => {
    const coordsMap = await geocodeCheckpoints(checkpointsToGeocode);
    setCheckpointCoords(coordsMap);
  };

  // Filter checkpoints
  const filteredCheckpoints = useMemo(() => {
    let filtered = [...checkpoints];

    // Apply upcoming filter
    if (filterMode === 'upcoming') {
      filtered = filtered.filter((cp) => isUpcoming(cp.Date));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cp) =>
          cp.City?.toLowerCase().includes(query) ||
          cp.County?.toLowerCase().includes(query) ||
          cp.Location?.toLowerCase().includes(query)
      );
    }

    // Sort by date
    return filtered.sort((a, b) => {
      if (!a.Date && !b.Date) return 0;
      if (!a.Date) return 1;
      if (!b.Date) return -1;
      return a.Date.localeCompare(b.Date);
    });
  }, [checkpoints, searchQuery, filterMode]);

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      setIsLocating(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your location on the map.'
        );
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      
      // Smoothly animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000); // 1 second smooth animation
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback((checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    
    // Smoothly animate map to checkpoint
    const coords = checkpointCoords.get(checkpoint.id);
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 800); // Smooth animation
    }
  }, [checkpointCoords]);

  // Handle view details
  const handleViewDetails = useCallback((checkpoint: Checkpoint) => {
    setDetailCheckpoint(checkpoint);
  }, []);

  // Load boundary overlay for selected checkpoint
  useEffect(() => {
    if (!selectedCheckpoint) {
      setBoundaryPolygon(null);
      setBoundaryCircle(null);
      return;
    }

    const loadBoundary = async () => {
      const cityName = selectedCheckpoint.City?.trim();
      const color = getLocationColor(selectedCheckpoint.County);
      const coords = checkpointCoords.get(selectedCheckpoint.id);

      if (!cityName || cityName === 'Unknown City') {
        // Use circle fallback
        if (coords) {
          setBoundaryPolygon(null);
          setBoundaryCircle({
            center: coords,
            radius: 5000, // 5km radius
          });
        }
        return;
      }

      // Try to fetch city boundary
      const geojson = await fetchCityBoundary(cityName);
      const polygon = convertGeoJSONToPolygon(geojson);

      if (polygon && polygon.length > 0) {
        setBoundaryPolygon(polygon);
        setBoundaryCircle(null);
        
        // Fit map to boundary
        if (mapRef.current && polygon.length > 0) {
          const lats = polygon.map(p => p.latitude);
          const lngs = polygon.map(p => p.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          
          mapRef.current.fitToCoordinates(polygon, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else if (coords) {
        // Fallback to circle
        setBoundaryPolygon(null);
        setBoundaryCircle({
          center: coords,
          radius: 5000,
        });
      }
    };

    loadBoundary();
  }, [selectedCheckpoint, checkpointCoords]);

  // Handle checkpoint select from list
  const handleCheckpointSelect = useCallback((checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setShowDrawer(false);
    
    // Smoothly animate map to checkpoint
    const coords = checkpointCoords.get(checkpoint.id);
    if (coords && mapRef.current) {
      // Small delay to let drawer close first
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000); // Smooth animation
      }, 300);
    }
  }, [checkpointCoords]);

  if (loading && checkpoints.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with safe area padding for Android */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapType="standard"
      >
        {/* User Location Marker (custom if needed) */}
        {userLocation && (
          <MapMarker
            coordinate={userLocation}
            title="You are here"
            pinColor="#3B82F6"
          />
        )}

        {/* Boundary Overlay - Polygon */}
        {boundaryPolygon && selectedCheckpoint && (() => {
          const color = getLocationColor(selectedCheckpoint.County);
          return (
            <Polygon
              coordinates={boundaryPolygon}
              strokeColor={color}
              fillColor={hexToRgba(color, 0.15)}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          );
        })()}

        {/* Boundary Overlay - Circle (fallback) */}
        {boundaryCircle && selectedCheckpoint && (() => {
          const color = getLocationColor(selectedCheckpoint.County);
          return (
            <Circle
              center={boundaryCircle.center}
              radius={boundaryCircle.radius}
              strokeColor={color}
              fillColor={hexToRgba(color, 0.15)}
              strokeWidth={3}
              lineDashPattern={[8, 6]}
            />
          );
        })()}

        {/* Checkpoint Markers */}
        {filteredCheckpoints.map((checkpoint) => {
          const coords = checkpointCoords.get(checkpoint.id);
          // Only render marker if we have coordinates
          if (!coords) return null;
          return (
            <CheckpointMarker
              key={checkpoint.id}
              checkpoint={checkpoint}
              isSelected={selectedCheckpoint?.id === checkpoint.id}
              onPress={() => handleMarkerPress(checkpoint)}
              onViewDetails={() => handleViewDetails(checkpoint)}
              coordinates={coords}
            />
          );
        })}
      </MapView>

      {/* Bottom Navigation */}
      <BottomNavigation
        onLocatePress={getUserLocation}
        onListPress={() => setShowDrawer(true)}
        isLocating={isLocating}
        checkpointCount={filteredCheckpoints.length}
      />

      {/* Bottom Drawer */}
      <BottomDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        checkpoints={filteredCheckpoints}
        selectedCheckpoint={selectedCheckpoint}
        onSelectCheckpoint={handleCheckpointSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        loading={loading}
      />

      {/* Detail Modal */}
      <CheckpointDetailModal
        visible={!!detailCheckpoint}
        checkpoint={detailCheckpoint}
        onClose={() => setDetailCheckpoint(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  safeHeader: {
    backgroundColor: COLORS.primary,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  logo: {
    height: 40,
    width: 150,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;


// Geocoding utility with city/county coordinate mapping
// This matches the web app's coordinate system

const cityCoords: Record<string, { latitude: number; longitude: number }> = {
  'El Centro': { latitude: 32.792, longitude: -115.563 },
  'Glendora': { latitude: 34.136, longitude: -117.865 },
  'Monterey Park': { latitude: 34.062, longitude: -118.123 },
  'Pleasanton': { latitude: 37.663, longitude: -121.875 },
  'Union City': { latitude: 37.596, longitude: -122.019 },
  'Lincoln': { latitude: 38.891, longitude: -121.293 },
  'Oceanside': { latitude: 33.196, longitude: -117.380 },
  'San Jacinto': { latitude: 33.784, longitude: -116.958 },
  'Greenfield': { latitude: 36.321, longitude: -121.244 },
  'Vacaville': { latitude: 38.357, longitude: -121.987 },
};

const countyCoords: Record<string, { latitude: number; longitude: number }> = {
  'Imperial': { latitude: 32.792, longitude: -115.563 },
  'L.A': { latitude: 34.052, longitude: -118.243 },
  'LA': { latitude: 34.052, longitude: -118.243 },
  'Alameda': { latitude: 37.602, longitude: -122.061 },
  'Placer County': { latitude: 38.891, longitude: -121.293 },
  'San diego': { latitude: 32.716, longitude: -117.163 },
  'Riverside': { latitude: 33.980, longitude: -117.375 },
  'Monterey': { latitude: 36.600, longitude: -121.894 },
  'Solono': { latitude: 38.357, longitude: -121.987 },
  'Fresno County': { latitude: 36.746, longitude: -119.772 },
};

const DEFAULT_CENTER = { latitude: 36.7783, longitude: -119.4179 };

// Cache for geocoded coordinates
const coordsCache = new Map<string, { latitude: number; longitude: number }>();

/**
 * Get coordinates for a checkpoint
 * Tries city first, then county, then defaults to California center
 */
export const getCheckpointCoordinates = (
  city: string | null,
  county: string | null,
  state: string = 'CA'
): { latitude: number; longitude: number } => {
  const cacheKey = `${city || ''}-${county || ''}-${state}`.toLowerCase().trim();
  
  // Check cache
  if (coordsCache.has(cacheKey)) {
    return coordsCache.get(cacheKey)!;
  }

  // Try city first
  if (city) {
    const trimmedCity = city.trim();
    if (cityCoords[trimmedCity]) {
      const coords = cityCoords[trimmedCity];
      coordsCache.set(cacheKey, coords);
      return coords;
    }
  }

  // Try county
  if (county) {
    const trimmedCounty = county.trim();
    if (countyCoords[trimmedCounty]) {
      const coords = countyCoords[trimmedCounty];
      coordsCache.set(cacheKey, coords);
      return coords;
    }
  }

  // Default to California center
  coordsCache.set(cacheKey, DEFAULT_CENTER);
  return DEFAULT_CENTER;
};

/**
 * Batch geocode checkpoints
 */
export const geocodeCheckpoints = async (
  checkpoints: Array<{ id: string; City?: string | null; County?: string | null; State?: string }>
): Promise<Map<string, { latitude: number; longitude: number }>> => {
  const coordsMap = new Map<string, { latitude: number; longitude: number }>();
  
  checkpoints.forEach((checkpoint) => {
    const coords = getCheckpointCoordinates(
      checkpoint.City || null,
      checkpoint.County || null,
      checkpoint.State || 'CA'
    );
    coordsMap.set(checkpoint.id, coords);
  });
  
  return coordsMap;
};


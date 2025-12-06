// Fetch city boundary from Nominatim (OpenStreetMap)
const boundaryCache = new Map<string, any>();

export const fetchCityBoundary = async (
  cityName: string,
  state: string = 'California'
): Promise<any | null> => {
  try {
    const cacheKey = `${cityName}-${state}`.toLowerCase();
    
    // Check cache first
    if (boundaryCache.has(cacheKey)) {
      return boundaryCache.get(cacheKey);
    }

    const query = `${cityName}, ${state}, USA`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DUI-Checkpoint-Map/1.0',
      },
    });
    
    if (!response.ok) {
      boundaryCache.set(cacheKey, null);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].geojson) {
      boundaryCache.set(cacheKey, data[0].geojson);
      return data[0].geojson;
    }
    
    boundaryCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error('Error fetching city boundary:', error);
    return null;
  }
};

/**
 * Convert GeoJSON coordinates to react-native-maps format
 */
export const convertGeoJSONToPolygon = (geojson: any): Array<{ latitude: number; longitude: number }> | null => {
  if (!geojson || !geojson.coordinates) return null;

  try {
    // Handle different GeoJSON types
    let coordinates: number[][] = [];
    
    if (geojson.type === 'Polygon') {
      coordinates = geojson.coordinates[0]; // First ring
    } else if (geojson.type === 'MultiPolygon') {
      coordinates = geojson.coordinates[0][0]; // First polygon, first ring
    } else {
      return null;
    }

    // Convert [longitude, latitude] to {latitude, longitude}
    return coordinates.map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
  } catch (error) {
    console.error('Error converting GeoJSON:', error);
    return null;
  }
};


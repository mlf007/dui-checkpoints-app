'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Checkpoint } from '@/lib/types/checkpoint'
import { getLocationColor } from '@/lib/utils/colors'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapContainerProps {
  checkpoints: Checkpoint[]
  selectedCheckpoint: Checkpoint | null
  userLocation: [number, number] | null
  center: [number, number]
  zoom: number
  onMarkerClick: (checkpoint: Checkpoint) => void
  onViewDetails: (checkpoint: Checkpoint) => void
}

// Dynamic color generation for counties - uses hash-based color assignment
// Same county name always gets the same color, works for any county across the country
function getCountyColor(county: string | null): string {
  return getLocationColor(county)
}

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false, isToday: boolean = false) => {
  const size = isSelected ? 44 : 34
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-wrapper ${isSelected ? 'selected' : ''}" style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
          <path fill="${color}" stroke="white" stroke-width="1.5" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
          <circle cx="12" cy="8" r="3.5" fill="white"/>
        </svg>
        ${isToday ? '<div class="today-badge">!</div>' : ''}
        ${isSelected ? '<div class="selected-ring"></div>' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 5],
  })
}

// User location icon
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-marker">
      <div class="user-dot"></div>
      <div class="user-pulse"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Cache for geocoded coordinates - persists across renders
const coordsCache = new Map<string, [number, number]>()

// Default center (California) when no coordinates found
const DEFAULT_CENTER: [number, number] = [36.7783, -119.4179]

// Geocode a location name to coordinates using Nominatim
async function geocodeLocation(locationName: string, state: string = 'California'): Promise<[number, number] | null> {
  try {
    const query = `${locationName}, ${state}, USA`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DUI-Checkpoint-Map/1.0'
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      return [parseFloat(lat), parseFloat(lon)]
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Get coordinates for a checkpoint - tries city first, then county
// Returns cached value or default, and triggers async geocoding if needed
function getCoordinates(checkpoint: Checkpoint): [number, number] {
  const city = checkpoint.City?.trim()
  const county = checkpoint.County?.trim()
  const state = checkpoint.State || 'CA'
  
  // Try city cache first
  if (city) {
    const cityKey = `city:${city}:${state}`.toLowerCase()
    if (coordsCache.has(cityKey)) {
      return coordsCache.get(cityKey)!
    }
  }
  
  // Try county cache
  if (county) {
    const countyKey = `county:${county}:${state}`.toLowerCase()
    if (coordsCache.has(countyKey)) {
      return coordsCache.get(countyKey)!
    }
  }
  
  // Return default - async geocoding will update later
  return DEFAULT_CENTER
}

// Async function to geocode and cache coordinates for a checkpoint
async function geocodeCheckpoint(checkpoint: Checkpoint): Promise<[number, number]> {
  const city = checkpoint.City?.trim()
  const county = checkpoint.County?.trim()
  const state = checkpoint.State === 'CA' ? 'California' : checkpoint.State || 'California'
  
  // Try city first
  if (city) {
    const cityKey = `city:${city}:${state}`.toLowerCase()
    if (!coordsCache.has(cityKey)) {
      const coords = await geocodeLocation(city, state)
      if (coords) {
        coordsCache.set(cityKey, coords)
        return coords
      }
    } else {
      return coordsCache.get(cityKey)!
    }
  }
  
  // Try county
  if (county) {
    const countyKey = `county:${county}:${state}`.toLowerCase()
    if (!coordsCache.has(countyKey)) {
      const countyName = county.includes('County') ? county : `${county} County`
      const coords = await geocodeLocation(countyName, state)
      if (coords) {
        coordsCache.set(countyKey, coords)
        return coords
      }
    } else {
      return coordsCache.get(countyKey)!
    }
  }
  
  return DEFAULT_CENTER
}

// Fetch city boundary from Nominatim (OpenStreetMap)
async function fetchCityBoundary(cityName: string, state: string = 'California'): Promise<any | null> {
  try {
    const query = `${cityName}, ${state}, USA`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DUI-Checkpoint-Map/1.0'
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data && data.length > 0 && data[0].geojson) {
      return data[0].geojson
    }
    
    return null
  } catch (error) {
    console.error('Error fetching city boundary:', error)
    return null
  }
}

export default function MapContainer({
  checkpoints,
  selectedCheckpoint,
  userLocation,
  center,
  zoom,
  onMarkerClick,
  onViewDetails,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const initializedRef = useRef(false)
  const viewDetailsRef = useRef(onViewDetails)
  const boundaryCache = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    viewDetailsRef.current = onViewDetails
  }, [onViewDetails])

  // Parse date as local (not UTC) to avoid timezone issues
  const parseLocalDate = useCallback((dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [])

  const isToday = useCallback((dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = parseLocalDate(dateString)
    const today = new Date()
    return checkpointDate.toDateString() === today.toDateString()
  }, [parseLocalDate])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return
    initializedRef.current = true

    const style = document.createElement('style')
    style.textContent = `
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      .marker-wrapper {
        transition: transform 0.2s ease;
        cursor: pointer;
      }
      .marker-wrapper:hover {
        transform: scale(1.15);
      }
      .marker-wrapper.selected {
        transform: scale(1.25);
        z-index: 1000 !important;
      }
      .today-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 18px;
        height: 18px;
        background: #DC2626;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        animation: pulse-badge 1.5s ease-in-out infinite;
      }
      @keyframes pulse-badge {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      .selected-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -70%);
        width: 55px;
        height: 55px;
        border: 3px solid currentColor;
        border-radius: 50%;
        animation: pulse-selected 1.5s ease-out infinite;
        pointer-events: none;
      }
      @keyframes pulse-selected {
        0% { transform: translate(-50%, -70%) scale(0.8); opacity: 1; }
        100% { transform: translate(-50%, -70%) scale(1.5); opacity: 0; }
      }
      .user-marker {
        position: relative;
        width: 24px;
        height: 24px;
      }
      .user-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        z-index: 2;
      }
      .user-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(59, 130, 246, 0.25);
        border-radius: 50%;
        animation: user-pulse 2s ease-out infinite;
      }
      @keyframes user-pulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }
      .leaflet-popup-content {
        margin: 0;
        min-width: 200px;
      }
      .leaflet-popup-tip {
        background: white;
      }
      .popup-content {
        padding: 16px;
      }
      .popup-title {
        font-weight: 700;
        font-size: 16px;
        color: #1a202c;
        margin-bottom: 4px;
      }
      .popup-county {
        font-size: 13px;
        margin-bottom: 8px;
      }
      .popup-date {
        font-size: 13px;
        color: #4a5568;
        margin-bottom: 12px;
      }
      .popup-btn {
        width: 100%;
        padding: 10px 16px;
        background: #E86C2C;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .popup-btn:hover {
        background: #d55a1a;
      }
      .city-boundary {
        animation: pulse-boundary 3s ease-in-out infinite;
      }
      @keyframes pulse-boundary {
        0%, 100% { 
          opacity: 0.7;
          stroke-width: 3;
        }
        50% { 
          opacity: 0.4;
          stroke-width: 4;
        }
      }
    `
    document.head.appendChild(style)
    styleRef.current = style

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      // Mobile-specific options
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      scrollWheelZoom: false, // Disable scroll wheel on mobile
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    // Force map to recalculate size on mobile after initialization
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Handle window resize and orientation change on mobile
    const handleResize = () => {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      map.remove()
      mapRef.current = null
      initializedRef.current = false
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
    }
  }, [center, zoom])

  // Update markers - FAST: Create all markers immediately, then batch geocode
  useEffect(() => {
    if (!mapRef.current) return

    const currentMarkerIds = new Set<string>()

    // STEP 1: Create/update all markers IMMEDIATELY with cached/default coordinates
    // This ensures all markers appear instantly on the map
    checkpoints.forEach((checkpoint) => {
      currentMarkerIds.add(checkpoint.id)
      
      // Get initial coordinates (cached or default - will be updated later if needed)
      const coords = getCoordinates(checkpoint)
      
      const isSelected = selectedCheckpoint?.id === checkpoint.id
      const isTodayCheckpoint = isToday(checkpoint.Date)
      const color = getCountyColor(checkpoint.County)
      const icon = createCustomIcon(color, isSelected, isTodayCheckpoint)

      let marker = markersRef.current.get(checkpoint.id)

      if (marker) {
        // Update existing marker
        marker.setIcon(icon)
        const currentLatLng = marker.getLatLng()
        // Only update position if it's significantly different (not just default center)
        if (Math.abs(currentLatLng.lat - coords[0]) > 0.01 || Math.abs(currentLatLng.lng - coords[1]) > 0.01) {
          marker.setLatLng(coords)
        }
      } else {
        // Create new marker immediately
        marker = L.marker(coords, { icon })
          .addTo(mapRef.current!)

        const popupContent = document.createElement('div')
        popupContent.className = 'popup-content'
        // Display date exactly as stored in database (no conversion)
        const formattedDate = checkpoint.Date || 'Date TBD'
        popupContent.innerHTML = `
          <div class="popup-title">${checkpoint.City || 'Unknown City'}</div>
          <div class="popup-county" style="color: ${color}">${checkpoint.County || ''}</div>
          <div class="popup-date">${formattedDate}</div>
        `
        
        const btn = document.createElement('button')
        btn.className = 'popup-btn'
        btn.textContent = 'View Details'
        btn.onclick = (e) => {
          e.stopPropagation()
          viewDetailsRef.current(checkpoint)
        }
        popupContent.appendChild(btn)

        marker.bindPopup(popupContent, {
          closeButton: true,
          className: 'custom-popup'
        })

        marker.on('click', () => {
          onMarkerClick(checkpoint)
        })

        markersRef.current.set(checkpoint.id, marker)
      }
    })

    // Remove markers for checkpoints no longer in list
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    // STEP 2: Batch geocode missing coordinates in parallel (with rate limiting)
    // This runs in the background and updates positions as they're found
    const batchGeocode = async () => {
      const checkpointsToGeocode: Array<{ checkpoint: Checkpoint; marker: L.Marker; key: string }> = []
      
      // Collect all checkpoints that need geocoding
      checkpoints.forEach((checkpoint) => {
        const marker = markersRef.current.get(checkpoint.id)
        if (!marker) return
        
        const city = checkpoint.City?.trim()
        const county = checkpoint.County?.trim()
        const state = checkpoint.State || 'CA'
        
        const cityKey = city ? `city:${city}:${state}`.toLowerCase() : null
        const countyKey = county ? `county:${county}:${state}`.toLowerCase() : null
        
        // Check if we need to geocode
        const needsGeocoding = (cityKey && !coordsCache.has(cityKey)) || 
                               (!cityKey && countyKey && !coordsCache.has(countyKey))
        
        if (needsGeocoding) {
          checkpointsToGeocode.push({
            checkpoint,
            marker,
            key: cityKey || countyKey || ''
          })
        }
      })

      // Process in batches of 5 to respect rate limits and avoid overwhelming the API
      const BATCH_SIZE = 5
      const DELAY_BETWEEN_BATCHES = 1000 // 1 second between batches
      
      for (let i = 0; i < checkpointsToGeocode.length; i += BATCH_SIZE) {
        const batch = checkpointsToGeocode.slice(i, i + BATCH_SIZE)
        
        // Process batch in parallel
        const geocodePromises = batch.map(async ({ checkpoint, marker }) => {
          try {
            const newCoords = await geocodeCheckpoint(checkpoint)
            if (newCoords && mapRef.current && marker) {
              // Only update if coordinates are significantly different from default
              const currentLatLng = marker.getLatLng()
              const isDefaultCenter = Math.abs(currentLatLng.lat - DEFAULT_CENTER[0]) < 0.1 &&
                                     Math.abs(currentLatLng.lng - DEFAULT_CENTER[1]) < 0.1
              
              if (isDefaultCenter || 
                  Math.abs(currentLatLng.lat - newCoords[0]) > 0.01 || 
                  Math.abs(currentLatLng.lng - newCoords[1]) > 0.01) {
                marker.setLatLng(newCoords)
              }
            }
          } catch (error) {
            console.warn('Geocoding failed for checkpoint:', checkpoint.id, error)
          }
        })
        
        await Promise.all(geocodePromises)
        
        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < checkpointsToGeocode.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }
    }

    // Start geocoding in background (don't await - let it run async)
    batchGeocode()
  }, [checkpoints, selectedCheckpoint, onMarkerClick, isToday])

  // Update boundary overlay for selected checkpoint - ACTUAL CITY BOUNDARY
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing boundary
    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.remove()
      boundaryLayerRef.current = null
    }

    if (!selectedCheckpoint) return

    const cityName = selectedCheckpoint.City?.trim()
    const color = getCountyColor(selectedCheckpoint.County)
    const coords = getCoordinates(selectedCheckpoint)

    // Function to add boundary to map
    const addBoundary = (geojson: any) => {
      if (!mapRef.current) return

      const boundaryLayer = L.geoJSON(geojson, {
        style: {
          color: color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.15,
          dashArray: '5, 5',
          className: 'city-boundary'
        }
      }).addTo(mapRef.current)

      boundaryLayerRef.current = boundaryLayer

      // Fit map to boundary
      const bounds = boundaryLayer.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 13,
          animate: true 
        })
      }
    }

    // Try to get boundary
    const loadBoundary = async () => {
      if (!cityName || cityName === 'Unknown City') {
        // No city name, use circle fallback
        if (coords && mapRef.current) {
          const circle = L.circle(coords, {
            radius: 5000,
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.15,
            dashArray: '8, 6',
          }).addTo(mapRef.current)
          
          boundaryLayerRef.current = circle as any
          mapRef.current.setView(coords, 12, { animate: true })
        }
        return
      }

      // Check cache first
      const cacheKey = `${cityName}-California`
      if (boundaryCache.current.has(cacheKey)) {
        const cachedData = boundaryCache.current.get(cacheKey)
        if (cachedData) {
          addBoundary(cachedData)
        } else if (coords && mapRef.current) {
          // Cache says no boundary, use circle
          const circle = L.circle(coords, {
            radius: 5000,
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.15,
            dashArray: '8, 6',
          }).addTo(mapRef.current)
          boundaryLayerRef.current = circle as any
          mapRef.current.setView(coords, 12, { animate: true })
        }
        return
      }

      // Fetch from Nominatim
      const geojson = await fetchCityBoundary(cityName)
      
      // Cache the result (even if null)
      boundaryCache.current.set(cacheKey, geojson)
      
      if (geojson) {
        addBoundary(geojson)
      } else if (coords && mapRef.current) {
        // Fallback to circle if no boundary found
        const circle = L.circle(coords, {
          radius: 5000,
          color: color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.15,
          dashArray: '8, 6',
        }).addTo(mapRef.current)
        boundaryLayerRef.current = circle as any
        mapRef.current.setView(coords, 12, { animate: true })
      }

      // Open popup
      const marker = markersRef.current.get(selectedCheckpoint.id)
      if (marker) {
        marker.openPopup()
      }
    }

    loadBoundary()
  }, [selectedCheckpoint])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    if (userLocation) {
      userMarkerRef.current = L.marker(userLocation, { 
        icon: userLocationIcon,
        zIndexOffset: 1000 
      })
        .addTo(mapRef.current)
        .bindPopup('<div style="padding: 8px; text-align: center; font-weight: 600;">📍 You are here</div>')
      
      mapRef.current.setView(userLocation, 10, { animate: true })
    }
  }, [userLocation])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ 
        minHeight: '400px',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 0,
        touchAction: 'pan-x pan-y pinch-zoom'
      }}
    />
  )
}

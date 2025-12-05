'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Checkpoint } from '@/lib/types/checkpoint'

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

// County colors for markers
const countyColors: Record<string, string> = {
  'Imperial': '#DC2626',
  'L.A': '#E86C2C',
  'L.A ': '#E86C2C',
  'LA': '#F59E0B',
  'Alameda': '#059669',
  'Alameda ': '#059669',
  'Placer County': '#7C3AED',
  'San diego': '#2563EB',
  'Riverside': '#EC4899',
  'Monterey': '#0891B2',
  'Solono': '#CA8A04',
  'Fresno County': '#BE185D',
}

// Default color for unknown counties
const defaultColor = '#6B7280'

// Get color for a county
function getCountyColor(county: string | null): string {
  if (!county) return defaultColor
  const trimmed = county.trim()
  return countyColors[trimmed] || countyColors[county] || defaultColor
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

// City coordinates (fixed)
const cityCoords: Record<string, [number, number]> = {
  'El Centro': [32.792, -115.563],
  'Glendora': [34.136, -117.865],
  'Monterey Park': [34.062, -118.123],
  'Pleasanton': [37.663, -121.875],
  'Union City': [37.596, -122.019],
  ' Union City': [37.596, -122.019],
  'Lincoln': [38.891, -121.293],
  'Oceanside': [33.196, -117.380],
  'Oceanside ': [33.196, -117.380],
  'San Jacinto': [33.784, -116.958],
  'Greenfield': [36.321, -121.244],
  'Greenfield ': [36.321, -121.244],
  'Vacaville': [38.357, -121.987],
  'Vacaville ': [38.357, -121.987],
}

const countyCoords: Record<string, [number, number]> = {
  'Imperial': [32.792, -115.563],
  'L.A': [34.052, -118.243],
  'L.A ': [34.052, -118.243],
  'LA': [34.052, -118.243],
  'Alameda': [37.602, -122.061],
  'Alameda ': [37.602, -122.061],
  'Placer County': [38.891, -121.293],
  'San diego': [32.716, -117.163],
  'Riverside': [33.980, -117.375],
  'Monterey': [36.600, -121.894],
  'Solono': [38.357, -121.987],
  'Fresno County': [36.746, -119.772],
}

// Get stable coordinates for a checkpoint
function getCoordinates(checkpoint: Checkpoint): [number, number] | null {
  const city = checkpoint.City?.trim()
  if (city && cityCoords[city]) {
    return cityCoords[city]
  }

  const county = checkpoint.County?.trim()
  if (county && countyCoords[county]) {
    return countyCoords[county]
  }

  return [36.7783, -119.4179]
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

  const isToday = useCallback((dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    return checkpointDate.toDateString() === today.toDateString()
  }, [])

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
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      initializedRef.current = false
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
    }
  }, [center, zoom])

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return

    const currentMarkerIds = new Set<string>()

    checkpoints.forEach((checkpoint) => {
      const coords = getCoordinates(checkpoint)
      if (!coords) return

      currentMarkerIds.add(checkpoint.id)
      const isSelected = selectedCheckpoint?.id === checkpoint.id
      const isTodayCheckpoint = isToday(checkpoint.Date)
      const color = getCountyColor(checkpoint.County)
      const icon = createCustomIcon(color, isSelected, isTodayCheckpoint)

      let marker = markersRef.current.get(checkpoint.id)

      if (marker) {
        marker.setIcon(icon)
      } else {
        marker = L.marker(coords, { icon })
          .addTo(mapRef.current!)

        const popupContent = document.createElement('div')
        popupContent.className = 'popup-content'
        popupContent.innerHTML = `
          <div class="popup-title">${checkpoint.City || 'Unknown City'}</div>
          <div class="popup-county" style="color: ${color}">${checkpoint.County || ''}</div>
          <div class="popup-date">${checkpoint.Date ? new Date(checkpoint.Date).toLocaleDateString() : 'Date TBD'}</div>
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

    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })
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
      style={{ minHeight: '400px' }}
    />
  )
}

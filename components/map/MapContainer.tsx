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
}

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false, isToday: boolean = false) => {
  const size = isSelected ? 44 : 34
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-wrapper ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
          <path fill="${color}" stroke="white" stroke-width="1" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
          <circle cx="12" cy="8" r="4" fill="white"/>
        </svg>
        ${isToday ? '<div class="today-pulse"></div>' : ''}
        ${isSelected ? '<div class="selected-ring"></div>' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
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

// County/Area bounds for California (approximate)
const countyBounds: Record<string, { bounds: L.LatLngBoundsExpression; color: string }> = {
  'Imperial': { bounds: [[32.5, -116.2], [33.2, -114.4]], color: '#DC2626' },
  'L.A': { bounds: [[33.6, -118.9], [34.5, -117.4]], color: '#E86C2C' },
  'LA': { bounds: [[33.6, -118.9], [34.5, -117.4]], color: '#E86C2C' },
  'Alameda': { bounds: [[37.4, -122.5], [37.95, -121.4]], color: '#059669' },
  'Alameda ': { bounds: [[37.4, -122.5], [37.95, -121.4]], color: '#059669' },
  'Placer County': { bounds: [[38.7, -121.6], [39.4, -119.8]], color: '#7C3AED' },
  'San diego': { bounds: [[32.4, -117.7], [33.6, -115.8]], color: '#2563EB' },
  'Riverside': { bounds: [[33.3, -117.8], [34.2, -114.2]], color: '#DC2626' },
  'Monterey': { bounds: [[35.7, -122.1], [37.0, -120.0]], color: '#0891B2' },
  'Solono': { bounds: [[37.9, -122.5], [38.7, -121.4]], color: '#CA8A04' },
  'Fresno County': { bounds: [[35.8, -121.0], [37.6, -118.2]], color: '#BE185D' },
}

// City coordinates (fixed, no randomization)
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

  // Default to California center
  return [36.7783, -119.4179]
}

export default function MapContainer({
  checkpoints,
  selectedCheckpoint,
  userLocation,
  center,
  zoom,
  onMarkerClick,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const areaLayerRef = useRef<L.Rectangle | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const initializedRef = useRef(false)

  // Check if checkpoint is today
  const isToday = useCallback((dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    return checkpointDate.toDateString() === today.toDateString()
  }, [])

  // Check if checkpoint is upcoming
  const isUpcoming = useCallback((dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkpointDate >= today
  }, [])

  // Get marker color based on checkpoint status
  const getMarkerColor = useCallback((checkpoint: Checkpoint) => {
    if (isToday(checkpoint.Date)) return '#DC2626' // Red for today
    if (isUpcoming(checkpoint.Date)) return '#E86C2C' // Orange for upcoming
    return '#6B7280' // Gray for past
  }, [isToday, isUpcoming])

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return
    initializedRef.current = true

    // Add custom styles
    const style = document.createElement('style')
    style.textContent = `
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      .marker-wrapper {
        transition: transform 0.2s ease;
      }
      .marker-wrapper:hover {
        transform: scale(1.1);
      }
      .marker-wrapper.selected {
        transform: scale(1.2);
        z-index: 1000 !important;
      }
      .today-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -70%);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(220, 38, 38, 0.3);
        animation: pulse-today 2s ease-out infinite;
      }
      .selected-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -70%);
        width: 50px;
        height: 50px;
        border: 3px solid #E86C2C;
        border-radius: 50%;
        animation: pulse-selected 1.5s ease-out infinite;
      }
      @keyframes pulse-today {
        0% { transform: translate(-50%, -70%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -70%) scale(2); opacity: 0; }
      }
      @keyframes pulse-selected {
        0% { transform: translate(-50%, -70%) scale(0.8); opacity: 1; }
        50% { transform: translate(-50%, -70%) scale(1.2); opacity: 0.5; }
        100% { transform: translate(-50%, -70%) scale(0.8); opacity: 1; }
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
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      }
      .leaflet-popup-content {
        margin: 0;
        min-width: 180px;
      }
      .leaflet-popup-tip {
        background: white;
      }
      .county-overlay {
        transition: all 0.3s ease;
      }
      @keyframes pulse-overlay {
        0%, 100% { 
          opacity: 1;
          stroke-width: 4;
        }
        50% { 
          opacity: 0.6;
          stroke-width: 6;
        }
      }
    `
    document.head.appendChild(style)
    styleRef.current = style

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
    })

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Add tile layer
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

  // Update markers when checkpoints change
  useEffect(() => {
    if (!mapRef.current) return

    const currentMarkerIds = new Set<string>()

    // Add/update checkpoint markers
    checkpoints.forEach((checkpoint) => {
      const coords = getCoordinates(checkpoint)
      if (!coords) return

      currentMarkerIds.add(checkpoint.id)
      const isSelected = selectedCheckpoint?.id === checkpoint.id
      const isTodayCheckpoint = isToday(checkpoint.Date)
      const color = getMarkerColor(checkpoint)
      const icon = createCustomIcon(color, isSelected, isTodayCheckpoint)

      let marker = markersRef.current.get(checkpoint.id)

      if (marker) {
        // Update existing marker icon only
        marker.setIcon(icon)
      } else {
        // Create new marker
        marker = L.marker(coords, { icon })
          .addTo(mapRef.current!)

        // Add popup
        const popupContent = `
          <div style="padding: 12px;">
            <div style="font-weight: 600; font-size: 14px; color: #1a202c; margin-bottom: 4px;">
              ${checkpoint.City || 'Unknown City'}
            </div>
            <div style="font-size: 12px; color: #E86C2C; margin-bottom: 8px;">
              ${checkpoint.County || ''}
            </div>
            <div style="font-size: 12px; color: #4a5568;">
              ${checkpoint.Date ? new Date(checkpoint.Date).toLocaleDateString() : 'Date TBD'}
            </div>
          </div>
        `
        marker.bindPopup(popupContent)

        // Handle click
        marker.on('click', () => {
          onMarkerClick(checkpoint)
        })

        markersRef.current.set(checkpoint.id, marker)
      }
    })

    // Remove markers that are no longer in checkpoints
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })
  }, [checkpoints, selectedCheckpoint, onMarkerClick, getMarkerColor, isToday])

  // Update area overlay for selected checkpoint
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing area overlay
    if (areaLayerRef.current) {
      areaLayerRef.current.remove()
      areaLayerRef.current = null
    }

    // Add area overlay for selected checkpoint
    if (selectedCheckpoint) {
      const county = selectedCheckpoint.County?.trim()
      if (county && countyBounds[county]) {
        const { bounds, color } = countyBounds[county]
        
        // Create a styled rectangle overlay
        const rectangle = L.rectangle(bounds, {
          color: color,
          weight: 4,
          fillColor: color,
          fillOpacity: 0.18,
          dashArray: '10, 6',
          className: 'county-overlay',
        }).addTo(mapRef.current)

        // Add a pulsing effect class
        const element = rectangle.getElement()
        if (element) {
          element.style.animation = 'pulse-overlay 2s ease-in-out infinite'
        }
        
        areaLayerRef.current = rectangle

        // Fit map to show the entire county area
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 9,
          animate: true 
        })
      } else {
        // No county bounds, just pan to the checkpoint
        const coords = getCoordinates(selectedCheckpoint)
        if (coords) {
          mapRef.current.setView(coords, 11, { animate: true })
        }
      }
    }
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
      
      // Pan to user location
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

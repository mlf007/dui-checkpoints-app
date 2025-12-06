'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  X, 
  Locate,
  AlertCircle,
  Plus,
  Navigation
} from 'lucide-react'
import type { Checkpoint } from '@/lib/types/checkpoint'
import { getLocationColor } from '@/lib/utils/colors'

// Logo URL
const LOGO_URL = 'https://cdn.prod.website-files.com/668db2607224f56857ad5d85/66ac964485eaa20383644e2f_Group%20206.png'

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <p className="mt-4 text-brand-paragraph">Loading map...</p>
        </div>
      </div>
    )
  }
)

export default function MapPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null)
  const [detailCheckpoint, setDetailCheckpoint] = useState<Checkpoint | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mapCenter] = useState<[number, number]>([36.7783, -119.4179])
  const [mapZoom] = useState(6)
  const [filterMode, setFilterMode] = useState<'upcoming' | 'all'>('upcoming')
  const [mounted, setMounted] = useState(false)

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMobile && showDrawer) {
      const scrollY = window.scrollY
      const originalOverflow = document.body.style.overflow
      const originalPosition = document.body.style.position
      const originalTop = document.body.style.top
      const originalWidth = document.body.style.width
      const originalHeight = document.body.style.height
      
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      // Don't block touch on body - let map handle its own touches
      
      // Trigger map resize after a short delay
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 150)
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.position = originalPosition
        document.body.style.top = originalTop
        document.body.style.width = originalWidth
        document.body.style.height = originalHeight
        window.scrollTo(0, scrollY)
        // Trigger map resize when drawer closes
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 150)
      }
    }
  }, [isMobile, showDrawer])

  // Lock body scroll when detail modal is open on mobile
  useEffect(() => {
    if (isMobile && detailCheckpoint) {
      const scrollY = window.scrollY
      const originalOverflow = document.body.style.overflow
      const originalPosition = document.body.style.position
      const originalTop = document.body.style.top
      const originalWidth = document.body.style.width
      const originalHeight = document.body.style.height
      
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      // Trigger map resize after a short delay
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 150)
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.position = originalPosition
        document.body.style.top = originalTop
        document.body.style.width = originalWidth
        document.body.style.height = originalHeight
        window.scrollTo(0, scrollY)
        // Trigger map resize when modal closes
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'))
        }, 150)
      }
    }
  }, [isMobile, detailCheckpoint])

  // Fetch checkpoints
  useEffect(() => {
    fetchCheckpoints()
  }, [])

  const fetchCheckpoints = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dui-checkpoints')
      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (data.success && data.checkpoints) {
        console.log('Fetched checkpoints:', data.checkpoints.length)
        setCheckpoints(data.checkpoints)
      } else if (data.error) {
        console.error('API Error:', data.error, data.details)
        // Still set empty array to show "no checkpoints" message
        setCheckpoints([])
      } else {
        console.warn('Unexpected response format:', data)
        setCheckpoints([])
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error)
      setCheckpoints([])
    } finally {
      setLoading(false)
    }
  }

  // Filter checkpoints (only after component is mounted to avoid SSR date issues)
  const filteredCheckpoints = useMemo(() => {
    if (checkpoints.length === 0) return []
    
    // Helper to parse date as local (not UTC) to avoid timezone issues
    const toLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    let filtered = [...checkpoints]

    // Apply upcoming/all filter (only after mounted to avoid SSR date issues)
    if (mounted && filterMode === 'upcoming') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      filtered = filtered.filter(cp => {
        if (!cp.Date) return false
        const cpDate = toLocalDate(cp.Date)
        cpDate.setHours(0, 0, 0, 0)
        return cpDate >= today
      })
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cp => 
        cp.City?.toLowerCase().includes(query) ||
        cp.County?.toLowerCase().includes(query) ||
        cp.Location?.toLowerCase().includes(query)
      )
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = a.Date ? toLocalDate(a.Date).getTime() : 0
      const dateB = b.Date ? toLocalDate(b.Date).getTime() : 0
      return dateA - dateB
    })
  }, [checkpoints, searchQuery, filterMode, mounted])

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])
        setIsLocating(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setIsLocating(false)
        alert('Unable to get your location. Please enable location services.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Parse date string as local date (not UTC) to avoid timezone issues
  // "2025-12-21" should display as Dec 21 regardless of user's timezone
  const parseLocalDate = useCallback((dateString: string): Date => {
    // Split the date string and create date with local timezone
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }, [])

  // Check if checkpoint is today (only run on client)
  const isToday = useCallback((dateString: string | null) => {
    if (!mounted || !dateString) return false
    const checkpointDate = parseLocalDate(dateString)
    const today = new Date()
    return checkpointDate.toDateString() === today.toDateString()
  }, [mounted, parseLocalDate])

  // Check if checkpoint is upcoming (only run on client)
  const isUpcoming = useCallback((dateString: string | null) => {
    if (!mounted || !dateString) return false
    const checkpointDate = parseLocalDate(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkpointDate >= today
  }, [mounted, parseLocalDate])

  // Format date - display exactly as stored in database (no conversion)
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Date TBD'
    // Ensure it's a string and return exactly as it comes from database
    // Convert to string explicitly to prevent any Date object conversion
    return String(dateString)
  }, [])

  // Dynamic color generation for counties
  const getCountyColor = useCallback((county: string | null) => {
    return getLocationColor(county)
  }, [])

  // Handle checkpoint selection (from list) - just highlight on map
  const handleCheckpointSelect = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
    if (isMobile) {
      setShowDrawer(false)
    }
  }

  // Handle marker click from map - show overlay
  const handleMarkerClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
  }

  // Handle view details - open modal
  const handleViewDetails = useCallback((checkpoint: Checkpoint) => {
    setDetailCheckpoint(checkpoint)
  }, [])

  // Checkpoint List Component
  const CheckpointList = () => (
    <>
      {/* Search & Filters */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search city, county..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('upcoming')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'upcoming' 
                ? 'bg-brand-orange text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              filterMode === 'all' 
                ? 'bg-brand-blue-grey text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          {filteredCheckpoints.length} checkpoint{filteredCheckpoints.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Checkpoint List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            <p className="mt-2 text-sm text-brand-paragraph">Loading...</p>
          </div>
        ) : filteredCheckpoints.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-brand-paragraph">No checkpoints found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCheckpoints.map((checkpoint) => (
              <button
                key={checkpoint.id}
                onClick={() => handleCheckpointSelect(checkpoint)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedCheckpoint?.id === checkpoint.id 
                    ? 'bg-orange-50 border-l-4' 
                    : 'border-l-4 border-transparent'
                }`}
                style={{ 
                  borderLeftColor: selectedCheckpoint?.id === checkpoint.id 
                    ? getCountyColor(checkpoint.County) 
                    : 'transparent' 
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-brand-heading">
                      {checkpoint.City || 'Unknown City'}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: getCountyColor(checkpoint.County) }}>
                      {checkpoint.County}
                    </p>
                  </div>
                  {isToday(checkpoint.Date) ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                      TODAY
                    </span>
                  ) : isUpcoming(checkpoint.Date) ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Upcoming
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                      Past
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-brand-paragraph">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(checkpoint.Date)}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{checkpoint.Time || 'TBD'}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-brand-blue-grey to-brand-blue-grey/90 flex-shrink-0">
        <div className="text-white mb-2">
          <p className="font-semibold text-sm">Got stopped at a checkpoint?</p>
          <p className="text-xs text-gray-300">The Meehan Law Firm is here to help 24/7</p>
        </div>
        <a 
          href="tel:8444384786"
          className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Phone className="h-5 w-5" />
          (844) 4-DUI STOP
        </a>
      </div>
    </>
  )

  return (
    <div 
      className="h-screen flex flex-col bg-gray-50"
      style={isMobile && (showDrawer || detailCheckpoint) ? { 
        position: 'fixed', 
        width: '100%', 
        height: '100%',
        overflow: 'hidden'
        // Don't block touch - let map handle its own gestures
      } : {}}
    >
      {/* Header - Desktop: Full header with phone, Mobile: Centered logo */}
      <header className="bg-brand-blue-grey py-3 px-4 shadow-lg z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-center md:justify-between">
          {/* Logo - centered on mobile */}
          <img 
            src={LOGO_URL} 
            alt="Meehan Law Firm" 
            className="h-10 md:h-12 w-auto"
          />
          
          {/* Desktop Only - Phone number display like screenshot */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              <a 
                href="tel:8444384786"
                className="flex items-center gap-2 text-white"
              >
                <span className="text-2xl font-bold tracking-wide">
                  <span className="text-white">(844) 4-</span>
                  <span className="text-brand-orange">DUI</span>
                  <span className="text-white"> STOP</span>
                </span>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-96 flex-shrink-0 bg-white shadow-xl flex flex-col h-full">
            <CheckpointList />
          </div>
        )}

        {/* Map Container */}
        <div 
          className="flex-1 relative"
          style={{ 
            minHeight: 0, // Important for flex children
            width: '100%',
            height: '100%',
            touchAction: 'pan-x pan-y pinch-zoom' // Allow map gestures
          }}
        >
          <MapContainer
            checkpoints={filteredCheckpoints}
            selectedCheckpoint={selectedCheckpoint}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onMarkerClick={handleMarkerClick}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation - iOS Style Floating - Smaller */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 pb-4 px-3 pt-1 bg-gradient-to-t from-white/90 to-transparent" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex items-center justify-between px-2 py-1.5">
            {/* Left - GPS Button */}
            <button
              onClick={getUserLocation}
              disabled={isLocating}
              className="flex flex-col items-center justify-center w-14 h-11 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Navigation className={`h-5 w-5 text-brand-blue-grey ${isLocating ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] text-gray-600 mt-0.5">Locate</span>
            </button>

            {/* Center - Plus Button (Opens Drawer) */}
            <button
              onClick={() => setShowDrawer(true)}
              className="relative -mt-7 flex items-center justify-center w-14 h-14 bg-brand-orange rounded-full shadow-xl hover:bg-brand-orange/90 transition-all active:scale-95 border-4 border-white"
            >
              <Plus className="h-7 w-7 text-white" />
              {/* Badge */}
              {filteredCheckpoints.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {filteredCheckpoints.length > 99 ? '99+' : filteredCheckpoints.length}
                </span>
              )}
            </button>

            {/* Right - Call Button */}
            <a
              href="tel:8444384786"
              className="flex flex-col items-center justify-center w-14 h-11 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Phone className="h-5 w-5 text-brand-orange" />
              <span className="text-[9px] text-gray-600 mt-0.5">Call</span>
            </a>
          </div>
        </div>
      )}

      {/* Mobile Bottom Drawer with Drag-to-Close */}
      {isMobile && showDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 10001, touchAction: 'none' }}
            onClick={() => setShowDrawer(false)}
            onTouchMove={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
          />
          
          {/* Drawer from Bottom */}
          <div 
            id="checkpoint-drawer"
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
            style={{ zIndex: 10002, maxHeight: '85vh', touchAction: 'pan-y' }}
          >
            {/* Drawer Handle - ONLY this area is draggable */}
            <div 
              className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onTouchStart={(e) => {
                e.stopPropagation()
                e.preventDefault()
                
                // Lock body scroll
                const body = document.body
                const originalOverflow = body.style.overflow
                const originalPosition = body.style.position
                const scrollY = window.scrollY
                body.style.overflow = 'hidden'
                body.style.position = 'fixed'
                body.style.width = '100%'
                body.style.top = `-${scrollY}px`
                
                const touch = e.touches[0]
                const startY = touch.clientY
                const drawer = document.getElementById('checkpoint-drawer')
                if (!drawer) return
                let currentY = startY
                
                const handleMove = (moveEvent: TouchEvent) => {
                  moveEvent.preventDefault()
                  moveEvent.stopPropagation()
                  currentY = moveEvent.touches[0].clientY
                  const diff = currentY - startY
                  if (diff > 0) {
                    drawer.style.transform = `translateY(${diff}px)`
                    drawer.style.transition = 'none'
                  }
                }
                
                const handleEnd = () => {
                  const diff = currentY - startY
                  drawer.style.transition = 'transform 0.3s ease-out'
                  if (diff > 80) {
                    drawer.style.transform = 'translateY(100%)'
                    setTimeout(() => {
                      setShowDrawer(false)
                      // Restore body scroll
                      body.style.overflow = originalOverflow
                      body.style.position = originalPosition
                      body.style.width = ''
                      body.style.top = ''
                      window.scrollTo(0, scrollY)
                    }, 300)
                  } else {
                    drawer.style.transform = 'translateY(0)'
                    // Restore body scroll
                    body.style.overflow = originalOverflow
                    body.style.position = originalPosition
                    body.style.width = ''
                    body.style.top = ''
                    window.scrollTo(0, scrollY)
                  }
                  document.removeEventListener('touchmove', handleMove, { capture: true })
                  document.removeEventListener('touchend', handleEnd, { capture: true })
                }
                
                document.addEventListener('touchmove', handleMove, { passive: false, capture: true })
                document.addEventListener('touchend', handleEnd, { capture: true })
              }}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Drawer Header - No X button */}
            <div className="flex items-center px-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-brand-heading">DUI Checkpoints</h2>
                <p className="text-xs text-gray-500">{filteredCheckpoints.length} locations found</p>
              </div>
            </div>
            
            {/* Drawer Content */}
            <div 
              className="flex-1 overflow-hidden flex flex-col"
              style={{ touchAction: 'pan-y' }}
            >
              <CheckpointList />
            </div>
          </div>
        </>
      )}

      {/* Detail Modal - Only opens from View Details button */}
      {detailCheckpoint && (
        <div 
          className="fixed inset-0 flex items-end md:items-center justify-center"
          style={{ zIndex: 10000 }}
          onClick={() => setDetailCheckpoint(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          
          <div 
            id="detail-modal"
            className="relative bg-white w-full md:max-w-lg md:mx-4 md:rounded-xl rounded-t-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color bar based on county */}
            <div 
              className="h-2" 
              style={{ backgroundColor: getCountyColor(detailCheckpoint.County) }}
            />
            
            {/* Handle - Drag indicator on mobile - ONLY this area is draggable */}
            <div 
              className="md:hidden flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onTouchStart={(e) => {
                e.stopPropagation()
                e.preventDefault()
                
                // Lock body scroll
                const body = document.body
                const originalOverflow = body.style.overflow
                const originalPosition = body.style.position
                const scrollY = window.scrollY
                body.style.overflow = 'hidden'
                body.style.position = 'fixed'
                body.style.width = '100%'
                body.style.top = `-${scrollY}px`
                
                const touch = e.touches[0]
                const startY = touch.clientY
                const modal = document.getElementById('detail-modal')
                if (!modal) return
                let currentY = startY
                
                const handleMove = (moveEvent: TouchEvent) => {
                  moveEvent.preventDefault()
                  moveEvent.stopPropagation()
                  currentY = moveEvent.touches[0].clientY
                  const diff = currentY - startY
                  if (diff > 0) {
                    modal.style.transform = `translateY(${diff}px)`
                    modal.style.transition = 'none'
                  }
                }
                
                const handleEnd = () => {
                  const diff = currentY - startY
                  modal.style.transition = 'transform 0.3s ease-out'
                  if (diff > 80) {
                    modal.style.transform = 'translateY(100%)'
                    setTimeout(() => {
                      setDetailCheckpoint(null)
                      // Restore body scroll
                      body.style.overflow = originalOverflow
                      body.style.position = originalPosition
                      body.style.width = ''
                      body.style.top = ''
                      window.scrollTo(0, scrollY)
                    }, 300)
                  } else {
                    modal.style.transform = 'translateY(0)'
                    // Restore body scroll
                    body.style.overflow = originalOverflow
                    body.style.position = originalPosition
                    body.style.width = ''
                    body.style.top = ''
                    window.scrollTo(0, scrollY)
                  }
                  document.removeEventListener('touchmove', handleMove, { capture: true })
                  document.removeEventListener('touchend', handleEnd, { capture: true })
                }
                
                document.addEventListener('touchmove', handleMove, { passive: false, capture: true })
                document.addEventListener('touchend', handleEnd, { capture: true })
              }}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header - X button only on desktop */}
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-brand-heading">
                    {detailCheckpoint.City || 'Unknown City'}
                  </h3>
                  {isToday(detailCheckpoint.Date) && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                      TODAY
                    </span>
                  )}
                </div>
                <p 
                  className="font-medium"
                  style={{ color: getCountyColor(detailCheckpoint.County) }}
                >
                  {detailCheckpoint.County}
                </p>
              </div>
              {/* X button only on desktop */}
              <button
                onClick={() => setDetailCheckpoint(null)}
                className="p-2 hover:bg-gray-100 rounded-full hidden md:block"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[45vh]">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: getCountyColor(detailCheckpoint.County) }} />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                  <p className="text-brand-heading">{detailCheckpoint.Location || 'Location not disclosed'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: getCountyColor(detailCheckpoint.County) }} />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                  <p className="text-brand-heading font-medium">{formatDate(detailCheckpoint.Date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: getCountyColor(detailCheckpoint.County) }} />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                  <p className="text-brand-heading">{detailCheckpoint.Time || 'Time not specified'}</p>
                </div>
              </div>

              {detailCheckpoint.Description && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</p>
                  <p className="text-sm text-brand-paragraph leading-relaxed">
                    {detailCheckpoint.Description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {detailCheckpoint.Source && (
                <a
                  href={detailCheckpoint.Source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-center text-brand-heading hover:bg-white transition-colors"
                >
                  View Source
                </a>
              )}
              <a
                href="tel:8444384786"
                className="flex-1 py-3 bg-brand-orange hover:bg-brand-orange/90 rounded-lg font-semibold text-white text-center flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Get Help
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

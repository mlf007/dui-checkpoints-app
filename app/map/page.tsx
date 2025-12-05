'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  Navigation, 
  X, 
  ChevronUp, 
  ChevronDown,
  Locate,
  Filter,
  List,
  Map as MapIcon,
  AlertCircle,
  Shield
} from 'lucide-react'
import type { Checkpoint } from '@/lib/types/checkpoint'

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.7783, -119.4179]) // California center
  const [mapZoom, setMapZoom] = useState(6)
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch checkpoints
  useEffect(() => {
    fetchCheckpoints()
  }, [])

  const fetchCheckpoints = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dui-checkpoints')
      const data = await response.json()
      
      if (data.success && data.checkpoints) {
        setCheckpoints(data.checkpoints)
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter checkpoints
  const filteredCheckpoints = useMemo(() => {
    return checkpoints.filter(cp => {
      // Upcoming filter
      if (showUpcomingOnly) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const cpDate = cp.Date ? new Date(cp.Date) : null
        if (!cpDate || cpDate < today) return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          cp.City?.toLowerCase().includes(query) ||
          cp.County?.toLowerCase().includes(query) ||
          cp.Location?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [checkpoints, searchQuery, showUpcomingOnly])

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
        setMapCenter([latitude, longitude])
        setMapZoom(10)
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

  // Check if checkpoint is upcoming
  const isUpcoming = (dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkpointDate >= today
  }

  // Check if checkpoint is today
  const isToday = (dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    return checkpointDate.toDateString() === today.toDateString()
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Handle checkpoint selection
  const handleCheckpointSelect = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  // Handle marker click from map
  const handleMarkerClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-brand-blue-grey text-white py-3 px-4 shadow-lg z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand-orange" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">DUI Checkpoint Map</h1>
              <p className="text-xs text-gray-300 hidden md:block">Find checkpoints near you</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={isLocating}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Locate className={`h-4 w-4 mr-1 ${isLocating ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Find Me'}</span>
            </Button>
            
            <a 
              href="tel:+1234567890"
              className="bg-brand-orange hover:bg-brand-orange/90 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Get Legal Help</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`
            ${isMobile 
              ? `absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${showSidebar ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}` 
              : 'w-96 flex-shrink-0'
            }
            bg-white shadow-xl flex flex-col
            ${isMobile ? 'rounded-t-2xl max-h-[70vh]' : 'h-full'}
          `}
        >
          {/* Mobile Handle */}
          {isMobile && (
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="w-full py-3 flex flex-col items-center border-b border-gray-100"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
              <div className="flex items-center gap-2 text-sm text-brand-paragraph">
                {showSidebar ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {filteredCheckpoints.length} checkpoints found
              </div>
            </button>
          )}

          {/* Search & Filters */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
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
              <Button
                variant={showUpcomingOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowUpcomingOnly(true)}
                className={showUpcomingOnly ? 'bg-brand-orange hover:bg-brand-orange/90' : ''}
              >
                Upcoming
              </Button>
              <Button
                variant={!showUpcomingOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowUpcomingOnly(false)}
                className={!showUpcomingOnly ? 'bg-brand-blue-grey hover:bg-brand-blue-grey/90' : ''}
              >
                All
              </Button>
            </div>
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
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCheckpoints.map((checkpoint) => (
                  <button
                    key={checkpoint.id}
                    onClick={() => handleCheckpointSelect(checkpoint)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedCheckpoint?.id === checkpoint.id ? 'bg-orange-50 border-l-4 border-brand-orange' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-brand-heading">
                          {checkpoint.City || 'Unknown City'}
                        </h3>
                        <p className="text-sm text-brand-orange">{checkpoint.County}</p>
                      </div>
                      {isToday(checkpoint.Date) ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full animate-pulse">
                          TODAY
                        </span>
                      ) : isUpcoming(checkpoint.Date) ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Past
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-brand-paragraph">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(checkpoint.Date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {checkpoint.Time || 'TBD'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Footer */}
          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-brand-blue-grey to-brand-blue-grey/90 flex-shrink-0">
            <div className="text-white mb-3">
              <p className="font-semibold text-sm">Got stopped at a checkpoint?</p>
              <p className="text-xs text-gray-300">The Meehan Law Firm is here to help 24/7</p>
            </div>
            <a 
              href="tel:+1234567890"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Call Now - Free Consultation
            </a>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            checkpoints={filteredCheckpoints}
            selectedCheckpoint={selectedCheckpoint}
            userLocation={userLocation}
            center={mapCenter}
            zoom={mapZoom}
            onMarkerClick={handleMarkerClick}
          />

          {/* Mobile Toggle Button */}
          {isMobile && !showSidebar && (
            <Button
              onClick={() => setShowSidebar(true)}
              className="absolute bottom-20 left-4 bg-white text-brand-heading shadow-lg"
              size="sm"
            >
              <List className="h-4 w-4 mr-1" />
              {filteredCheckpoints.length} Checkpoints
            </Button>
          )}
        </div>
      </div>

      {/* Selected Checkpoint Detail Modal */}
      {selectedCheckpoint && (
        <div 
          className="fixed inset-0 flex items-end md:items-center justify-center"
          style={{ zIndex: 10000 }}
          onClick={() => setSelectedCheckpoint(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          
          <div 
            className="relative bg-white w-full md:max-w-lg md:mx-4 md:rounded-xl rounded-t-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color bar based on status */}
            <div className={`h-2 ${isToday(selectedCheckpoint.Date) ? 'bg-red-500' : isUpcoming(selectedCheckpoint.Date) ? 'bg-brand-orange' : 'bg-gray-300'}`} />
            
            {/* Handle */}
            <div className="md:hidden flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-brand-heading">
                    {selectedCheckpoint.City || 'Unknown City'}
                  </h3>
                  {isToday(selectedCheckpoint.Date) && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                      TODAY
                    </span>
                  )}
                </div>
                <p className="text-brand-orange font-medium">{selectedCheckpoint.County}</p>
              </div>
              <button
                onClick={() => setSelectedCheckpoint(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[40vh]">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-orange mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                  <p className="text-brand-heading">{selectedCheckpoint.Location || 'Location not disclosed'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-brand-orange mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
                  <p className="text-brand-heading font-medium">{formatDate(selectedCheckpoint.Date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-brand-orange mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Time</p>
                  <p className="text-brand-heading">{selectedCheckpoint.Time || 'Time not specified'}</p>
                </div>
              </div>

              {selectedCheckpoint.Description && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</p>
                  <p className="text-sm text-brand-paragraph leading-relaxed">
                    {selectedCheckpoint.Description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {selectedCheckpoint.Source && (
                <a
                  href={selectedCheckpoint.Source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-center text-brand-heading hover:bg-white transition-colors"
                >
                  View Source
                </a>
              )}
              <a
                href="tel:+1234567890"
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


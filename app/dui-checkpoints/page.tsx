'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutGrid, List, Search, Filter, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { Checkpoint } from '@/lib/types/checkpoint'

export default function CheckpointsPage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [cityFilter, setCityFilter] = useState('all')
  const [countyFilter, setCountyFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 10

  // Detect mobile/tablet view and set default view mode
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmallScreen = window.innerWidth < 1024 // Mobile and tablets
      setIsMobile(window.innerWidth < 768)
      
      // Set grid view for mobile and tablets, table view for desktop
      if (isSmallScreen) {
        setViewMode('grid')
      }
    }
    
    // Set initial state
    const isSmallScreen = window.innerWidth < 1024
    setIsMobile(window.innerWidth < 768)
    setViewMode(isSmallScreen ? 'grid' : 'table')
    
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    fetchCheckpoints()
  }, [])

  const fetchCheckpoints = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dui-checkpoints')
      const data = await response.json()
      
      if (data.success && data.checkpoints) {
        // Sort by date (latest first - descending order)
        const sorted = [...data.checkpoints].sort((a: Checkpoint, b: Checkpoint) => {
          if (!a.Date && !b.Date) return 0
          if (!a.Date) return 1
          if (!b.Date) return -1
          return new Date(b.Date).getTime() - new Date(a.Date).getTime()
        })
        setCheckpoints(sorted)
      } else {
        console.error('Failed to load checkpoints:', data)
      }
    } catch (error) {
      console.error('Error fetching checkpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique values for filters
  const cities = useMemo(() => {
    const citySet = new Set<string>()
    checkpoints.forEach(cp => {
      if (cp.City) citySet.add(cp.City.trim())
    })
    return Array.from(citySet).sort()
  }, [checkpoints])

  const counties = useMemo(() => {
    const countySet = new Set<string>()
    checkpoints.forEach(cp => {
      if (cp.County) countySet.add(cp.County.trim())
    })
    return Array.from(countySet).sort()
  }, [checkpoints])

  // Filter checkpoints
  const filteredCheckpoints = useMemo(() => {
    return checkpoints.filter(cp => {
      // City filter
      if (cityFilter !== 'all' && cp.City?.trim() !== cityFilter) return false
      
      // County filter
      if (countyFilter !== 'all' && cp.County?.trim() !== countyFilter) return false
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesCity = cp.City?.toLowerCase().includes(query)
        const matchesCounty = cp.County?.toLowerCase().includes(query)
        const matchesLocation = cp.Location?.toLowerCase().includes(query)
        const matchesDescription = cp.Description?.toLowerCase().includes(query)
        if (!matchesCity && !matchesCounty && !matchesLocation && !matchesDescription) return false
      }
      
      return true
    })
  }, [checkpoints, cityFilter, countyFilter, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredCheckpoints.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCheckpoints = filteredCheckpoints.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [cityFilter, countyFilter, searchQuery])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isUpcoming = (dateString: string | null) => {
    if (!dateString) return false
    const checkpointDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return checkpointDate >= today
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <p className="mt-4 text-brand-paragraph dark:text-gray-400">Loading checkpoints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
     

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Filters and Controls */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-brand-heading dark:text-white">
                <Filter className="h-5 w-5 text-brand-orange" />
                Filters & Search
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle - Hidden on mobile */}
                <div className="hidden md:flex gap-2">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className={viewMode === 'table' ? 'bg-brand-blue-grey hover:bg-brand-blue-grey/90' : ''}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-brand-blue-grey hover:bg-brand-blue-grey/90' : ''}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Filter Content - Always visible on desktop, toggle on mobile */}
          <CardContent className={`${!showFilters ? 'hidden md:block' : 'block'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by city, county, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* City Filter */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* County Filter */}
              <Select value={countyFilter} onValueChange={setCountyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-brand-paragraph dark:text-gray-400">
              Showing {filteredCheckpoints.length} of {checkpoints.length} checkpoints
            </div>
          </CardContent>
          
          {/* Results count shown when filters are hidden on mobile */}
          {!showFilters && (
            <CardContent className="pt-0 md:hidden">
              <div className="text-sm text-brand-paragraph dark:text-gray-400">
                Showing {filteredCheckpoints.length} of {checkpoints.length} checkpoints
              </div>
            </CardContent>
          )}
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <>
            <Card className="shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-brand-blue-grey text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">County</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredCheckpoints.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-brand-paragraph dark:text-gray-400">
                            No checkpoints found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedCheckpoints.map((checkpoint) => (
                          <tr
                            key={checkpoint.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-brand-heading dark:text-white">
                              {checkpoint.City || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-brand-paragraph dark:text-gray-300">
                              {checkpoint.County || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-brand-paragraph dark:text-gray-300 max-w-xs truncate">
                              {checkpoint.Location || 'Undisclosed'}
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isUpcoming(checkpoint.Date)
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {formatDate(checkpoint.Date)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-brand-paragraph dark:text-gray-300 whitespace-nowrap">
                              {checkpoint.Time || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {checkpoint.Source && (
                                <a
                                  href={checkpoint.Source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-orange hover:underline inline-flex items-center gap-1"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {filteredCheckpoints.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-brand-paragraph dark:text-gray-400 hidden md:block">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCheckpoints.length)} of {filteredCheckpoints.length} checkpoints
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {!isMobile && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          const showEllipsisBefore = prevPage && page - prevPage > 1
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-brand-paragraph dark:text-gray-400">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[40px] ${currentPage === page ? 'bg-brand-blue-grey hover:bg-brand-blue-grey/90' : ''}`}
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCheckpoints.length === 0 ? (
                <div className="col-span-full text-center py-12 text-brand-paragraph dark:text-gray-400">
                  No checkpoints found matching your filters.
                </div>
              ) : (
                paginatedCheckpoints.map((checkpoint) => (
                  <Card key={checkpoint.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className={`h-1 ${isUpcoming(checkpoint.Date) ? 'bg-brand-orange' : 'bg-gray-300'}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-brand-heading dark:text-white mb-1">
                            {checkpoint.City || 'Unknown City'}
                          </CardTitle>
                          <p className="text-sm text-brand-orange font-medium">
                            {checkpoint.County || 'Unknown County'}
                          </p>
                        </div>
                        {isUpcoming(checkpoint.Date) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-brand-orange mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-brand-paragraph dark:text-gray-400 uppercase mb-1">
                            Location
                          </p>
                          <p className="text-sm text-brand-heading dark:text-white">
                            {checkpoint.Location || 'Location not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-brand-orange mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-brand-paragraph dark:text-gray-400 uppercase mb-1">
                            Date
                          </p>
                          <p className="text-sm text-brand-heading dark:text-white font-medium">
                            {formatDate(checkpoint.Date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-brand-orange mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-brand-paragraph dark:text-gray-400 uppercase mb-1">
                            Time
                          </p>
                          <p className="text-sm text-brand-heading dark:text-white">
                            {checkpoint.Time || 'Time not specified'}
                          </p>
                        </div>
                      </div>

                      {checkpoint.Source && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={checkpoint.Source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-orange hover:underline inline-flex items-center gap-1"
                          >
                            View Source <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination Controls for Grid View */}
            {filteredCheckpoints.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-brand-paragraph dark:text-gray-400 hidden md:block">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCheckpoints.length)} of {filteredCheckpoints.length} checkpoints
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {!isMobile && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          const showEllipsisBefore = prevPage && page - prevPage > 1
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && (
                                <span className="px-2 text-brand-paragraph dark:text-gray-400">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[40px] ${currentPage === page ? 'bg-brand-blue-grey hover:bg-brand-blue-grey/90' : ''}`}
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}


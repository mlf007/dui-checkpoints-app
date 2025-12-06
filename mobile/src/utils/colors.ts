// Dynamic color generation for counties/cities
// Creates consistent colors based on string hash - same name always gets same color

// A curated palette of distinguishable, visually appealing colors
const COLOR_PALETTE = [
  '#DC2626', // Red
  '#E86C2C', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#22C55E', // Green
  '#059669', // Emerald
  '#14B8A6', // Teal
  '#0891B2', // Cyan
  '#0EA5E9', // Sky
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Violet
  '#9333EA', // Purple
  '#C026D3', // Fuchsia
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#BE185D', // Deep Pink
  '#CA8A04', // Yellow
  '#65A30D', // Light Green
  '#0D9488', // Dark Teal
  '#1D4ED8', // Dark Blue
  '#6D28D9', // Dark Purple
  '#DB2777', // Magenta
  '#EA580C', // Deep Orange
]

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0
  const normalizedStr = str.toLowerCase().trim()
  
  for (let i = 0; i < normalizedStr.length; i++) {
    const char = normalizedStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash)
}

// Cache for generated colors to ensure consistency
const colorCache = new Map<string, string>()

/**
 * Get a consistent color for a county/city name
 * Same name will always return the same color
 */
export function getLocationColor(name: string | null | undefined): string {
  // Default color for null/undefined
  if (!name) return '#6B7280' // Gray
  
  const normalizedName = name.toLowerCase().trim()
  
  // Check cache first
  if (colorCache.has(normalizedName)) {
    return colorCache.get(normalizedName)!
  }
  
  // Generate color from hash
  const hash = hashString(normalizedName)
  const colorIndex = hash % COLOR_PALETTE.length
  const color = COLOR_PALETTE[colorIndex]
  
  // Cache the result
  colorCache.set(normalizedName, color)
  
  return color
}

/**
 * Get color for a checkpoint (uses county as primary, falls back to city)
 */
export function getCheckpointColor(county: string | null | undefined, city?: string | null): string {
  // Prefer county for color consistency across cities in same county
  if (county) {
    return getLocationColor(county)
  }
  
  // Fall back to city if no county
  if (city) {
    return getLocationColor(city)
  }
  
  return '#6B7280' // Default gray
}

// Default color for unknown locations
export const DEFAULT_COLOR = '#6B7280'


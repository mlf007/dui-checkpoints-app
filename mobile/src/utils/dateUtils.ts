/**
 * Format date - display exactly as stored in database (no conversion)
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Date TBD';
  // Return date exactly as it comes from database
  return String(dateString);
};

/**
 * Check if checkpoint is today
 */
export const isToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  // Parse date as local (not UTC) to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const checkpointDate = new Date(year, month - 1, day);
  const today = new Date();
  
  return checkpointDate.toDateString() === today.toDateString();
};

/**
 * Check if checkpoint is upcoming
 */
export const isUpcoming = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  // Parse date as local (not UTC) to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const checkpointDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return checkpointDate >= today;
};

/**
 * Get coordinates for a checkpoint (geocoding helper)
 * Returns default California center if coordinates not available
 */
export const getCheckpointCoordinates = (
  checkpoint: { City?: string | null; County?: string | null; State?: string }
): { latitude: number; longitude: number } => {
  // For now, return default center
  // In production, you'd geocode the city/county
  return {
    latitude: 36.7783,
    longitude: -119.4179,
  };
};


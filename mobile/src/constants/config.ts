// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'https://meehan-law-firm-dui-checkpoints.vercel.app'  // Local development
  : 'https://meehan-law-firm-dui-checkpoints.vercel.app'; // Production

// Branding
export const LOGO_URL = 'https://cdn.prod.website-files.com/668db2607224f56857ad5d85/66ac964485eaa20383644e2f_Group%20206.png';

export const PHONE_NUMBER = '8444384786';
export const PHONE_DISPLAY = '(844) 4-DUI STOP';

// Map Configuration
export const DEFAULT_MAP_CENTER = {
  latitude: 36.7783,
  longitude: -119.4179,
};

export const DEFAULT_ZOOM = 6;
export const DEFAULT_LATITUDE_DELTA = 10;
export const DEFAULT_LONGITUDE_DELTA = 10;

// Colors
export const COLORS = {
  primary: '#374151',      // Blue-grey
  accent: '#E86C2C',       // Orange
  success: '#059669',      // Green
  error: '#DC2626',        // Red
  gray: '#6B7280',         // Gray
  white: '#FFFFFF',
  black: '#000000',
  background: '#F9FAFB',
};


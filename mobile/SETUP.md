# Mobile App Setup Guide

## Quick Start

1. **Navigate to mobile folder:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Configuration

### API URL
Update `src/constants/config.ts`:
- Production: `https://meehan-law-firm-dui-checkpoints.vercel.app`
- Local: `http://localhost:3000` (when running Next.js locally)

### Google Maps API Key (Android)
For Android, you need a Google Maps API key:

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY_HERE"
        }
      }
    }
  }
}
```

## Features Implemented

✅ Interactive map with react-native-maps
✅ Custom color-coded markers (dynamic based on county)
✅ Real-time geolocation
✅ Bottom drawer with checkpoint list
✅ Search and filter functionality
✅ Detail modal with drag-to-close
✅ Bottom navigation (iOS style)
✅ Phone call integration
✅ Performance optimized (batch geocoding, memoization)

## Performance Optimizations

- **Batch Processing**: Checkpoints geocoded in batches
- **Memoization**: Filtered checkpoints memoized
- **Lazy Loading**: Map components load efficiently
- **Caching**: Coordinates cached to avoid recalculation

## Troubleshooting

### Map not showing
- Check if Google Maps API key is set (Android)
- Ensure location permissions are granted

### API connection issues
- Verify API_BASE_URL in `src/constants/config.ts`
- Check if Next.js backend is running
- Test API endpoint in browser first

### Build errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login:
   ```bash
   eas login
   ```

3. Configure:
   ```bash
   eas build:configure
   ```

4. Build:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### Manual Build

See [Expo documentation](https://docs.expo.dev/build/introduction/) for detailed instructions.


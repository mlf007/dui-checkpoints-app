# DUI Checkpoints Mobile App

Native iOS and Android mobile app for The Meehan Law Firm DUI Checkpoints Locator.

## Features

- 🗺️ Interactive map with custom color-coded markers
- 📍 Real-time geolocation
- 🔍 Search and filter checkpoints
- 📱 Native iOS/Android experience
- ⚡ Fast performance with optimized rendering
- 🎨 Beautiful UI matching web app design

## Setup

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Emulator
- Physical device with Expo Go app (optional)

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Configuration

### API URL

Update the API URL in `src/constants/config.ts`:

```typescript
export const API_BASE_URL = 'https://meehan-law-firm-dui-checkpoints.vercel.app';
```

For local development:
```typescript
export const API_BASE_URL = 'http://localhost:3000';
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Project Structure

```
mobile/
├── src/
│   ├── components/      # Reusable components
│   ├── screens/         # Screen components
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── constants/       # App constants
├── App.tsx              # Main app component
└── app.json             # Expo configuration
```

## Performance Optimizations

- ✅ Batch geocoding for checkpoints
- ✅ Memoized filtered checkpoints
- ✅ Optimized marker rendering
- ✅ Lazy loading of map components
- ✅ Efficient state management

## Notes

- The app connects to the Next.js backend API at `/api/dui-checkpoints`
- All checkpoints are fetched on app load
- Geolocation requires user permission
- Map markers use dynamic colors based on county


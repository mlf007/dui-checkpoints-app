import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapScreen from './src/screens/MapScreen';
import { COLORS } from './src/constants/config';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <MapScreen />
    </GestureHandlerRootView>
  );
}

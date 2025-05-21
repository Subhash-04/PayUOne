// Import polyfills first
import './polyfills';

// Import necessary Expo and React components
import React from 'react';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export default function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

// Register the root component
registerRootComponent(App); 
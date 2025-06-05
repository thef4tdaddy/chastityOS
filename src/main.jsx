import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Ensure this imports Tailwind's base styles as per your index.css
import App from './App.jsx';

// Firebase is now initialized centrally in App.jsx
// No need for Firebase imports or initialization here directly

// GA Measurement ID is also handled within App.jsx if needed for gtag
// const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

// The Main component here can be simplified or removed if App.jsx handles all state
// For now, just rendering App directly.
// If you had specific logic in Main that's not Firebase init, it could stay,
// but it seems its primary role was Firebase setup which is now moved.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

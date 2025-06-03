import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeApp } from 'firebase/app'; // Import Firebase app
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth

// Your Firebase configuration object (should ideally be in a separate config file or .env)
// As per your README, these come from VITE_ environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // This can also be your GA Measurement ID if they are the same
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Get the GA Measurement ID from Vite environment variables
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

const Main = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // If using anonymous sign-in, you might want to sign in the user here
        // Example: signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
      }
      setIsAuthReady(true); // Set auth ready once the initial check is done
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Optionally, you can show a loading indicator until Firebase auth is ready
  if (!isAuthReady) {
    // Or a more sophisticated loading component
    return <div className="text-center p-8 text-purple-300">Initializing authentication...</div>;
  }
  
  return (
    <StrictMode>
      <App 
        isAuthReady={isAuthReady} 
        userId={userId} 
        GA_MEASUREMENT_ID={gaMeasurementId} 
      />
    </StrictMode>
  );
};

createRoot(document.getElementById('root')).render(<Main />);
import React, { useEffect } from 'react';
import KeyholderSection from '../components/settings/KeyholderSection';

// This component now contains logic to automatically re-lock controls
// when the user navigates away from this page.
export default function KeyholderPage(props) {
  const { lockKeyholderControls, isKeyholderModeUnlocked } = props;

  // This useEffect hook will run when the component is first rendered
  // and will set up a cleanup function to run when it's unmounted.
  useEffect(() => {
    // The return statement of a useEffect hook is a cleanup function.
    // This function will be called automatically when the user navigates
    // to a different page.
    return () => {
      // If the controls are unlocked when the user leaves the page, lock them.
      if (isKeyholderModeUnlocked) {
        console.log("Navigating away from Keyholder page, locking controls.");
        lockKeyholderControls();
      }
    };
  }, [isKeyholderModeUnlocked, lockKeyholderControls]); // Dependencies for the effect

  return (
    <div className="container mx-auto p-4">
      {/* It continues to pass all props down to the section component */}
      <KeyholderSection {...props} />
    </div>
  );
}

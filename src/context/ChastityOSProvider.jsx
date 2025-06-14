import React from 'react';
import { ChastityOSContext } from './ChastityOSContextOnly.js';
import { useChastityState } from '../hooks/useChastityState.js';

// The provider component now accepts the currentUser from the App component.
export const ChastityOSProvider = ({ children, currentUser }) => {
  // The hook is called with the currentUser, which initiates all data fetching.
  const stateAndLogic = useChastityState(currentUser);

  return (
    <ChastityOSContext.Provider value={stateAndLogic}>
      {children}
    </ChastityOSContext.Provider>
  );
};

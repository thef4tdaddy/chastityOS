import { createContext, useContext } from 'react';

export const ChastityStateContext = createContext(null);

export const useSharedState = () => {
  const context = useContext(ChastityStateContext);
  if (context === null) {
    throw new Error('useSharedState must be used within a ChastityStateProvider');
  }
  return context;
};

import { useEffect, useCallback, useState } from 'react';

// Test hook with intentional exhaustive-deps issues
export const useTestHook = (userId, isActive, onUpdate) => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);

  // Missing dependency: onUpdate
  const processData = useCallback(() => {
    if (userId && isActive) {
      setCount(prev => prev + 1);
      onUpdate(count);
    }
  }, [userId, isActive, count]); // Missing onUpdate

  // Missing dependency: processData
  useEffect(() => {
    if (isActive) {
      processData();
    }
  }, [isActive]); // Missing processData

  // Missing dependency: userId
  useEffect(() => {
    if (data && userId) {
      console.log('Processing', data, userId);
    }
  }, [data]); // Missing userId

  return { count, data, setData };
};
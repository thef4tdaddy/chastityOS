import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyholderSession } from '../useKeyholderSession';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({
      toMillis: () => Date.now(),
    })),
  },
}));

describe('useKeyholderSession', () => {
  const mockSaveDataToFirestore = vi.fn();
  const defaultProps = {
    userId: 'test-user',
    isAuthReady: true,
    saveDataToFirestore: mockSaveDataToFirestore,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default session state', () => {
    const { result } = renderHook(() => useKeyholderSession(defaultProps));
    
    expect(result.current.session).toEqual({
      isKeyholderControlsLocked: false,
      requiredKeyholderDurationSeconds: 0,
      keyholderName: undefined,
      keyholderPasswordHash: undefined,
      lastActivity: undefined,
    });
    
    expect(result.current.isSessionLocked).toBe(false);
  });

  it('should lock session successfully', async () => {
    const { result } = renderHook(() => useKeyholderSession(defaultProps));
    
    await act(async () => {
      await result.current.lockSession();
    });
    
    expect(mockSaveDataToFirestore).toHaveBeenCalledWith({
      isKeyholderControlsLocked: true,
      lastActivity: expect.anything(),
    });
  });

  it('should set required duration with proper validation', async () => {
    const { result } = renderHook(() => useKeyholderSession(defaultProps));
    
    await act(async () => {
      await result.current.setRequiredDuration(3600); // 1 hour
    });
    
    expect(mockSaveDataToFirestore).toHaveBeenCalledWith({
      requiredKeyholderDurationSeconds: 3600,
      lastActivity: expect.anything(),
    });
  });

  it('should not set negative duration', async () => {
    const { result } = renderHook(() => useKeyholderSession(defaultProps));
    
    await act(async () => {
      await result.current.setRequiredDuration(-100);
    });
    
    expect(mockSaveDataToFirestore).not.toHaveBeenCalled();
  });

  it('should not perform actions when user is not authenticated', async () => {
    const { result } = renderHook(() => 
      useKeyholderSession({ ...defaultProps, isAuthReady: false })
    );
    
    await act(async () => {
      await result.current.lockSession();
    });
    
    expect(mockSaveDataToFirestore).not.toHaveBeenCalled();
  });

  it('should detect expired sessions', () => {
    const pastTimestamp = {
      toMillis: () => Date.now() - (60 * 60 * 1000), // 1 hour ago
    } as Timestamp;

    const { result } = renderHook(() => 
      useKeyholderSession({
        ...defaultProps,
        initialData: { lastActivity: pastTimestamp }
      })
    );
    
    expect(result.current.isSessionExpired(30)).toBe(true); // 30 minute timeout
    expect(result.current.isSessionExpired(120)).toBe(false); // 2 hour timeout
  });
});
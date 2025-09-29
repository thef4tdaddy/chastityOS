import { useState, useCallback, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { 
  MultiWearerData,
  WearerInfo,
  WearerPermission,
  GroupSettings,
  KeyholderSession,
  SaveDataFunction 
} from '../../types/keyholder';

interface UseMultiWearerProps {
  userId: string | null;
  isAuthReady: boolean;
  saveDataToFirestore: SaveDataFunction;
  initialData?: Partial<MultiWearerData>;
}

interface UseMultiWearerReturn {
  multiWearerData: MultiWearerData;
  activeWearer: WearerInfo | undefined;
  addWearer: (wearerInfo: Omit<WearerInfo, 'id' | 'joinedAt'>) => Promise<string>;
  removeWearer: (wearerId: string) => Promise<void>;
  setActiveWearer: (wearerId: string) => Promise<void>;
  updateWearerStatus: (wearerId: string, status: WearerInfo['status']) => Promise<void>;
  updateWearerPermissions: (wearerId: string, permissions: WearerPermission[]) => Promise<void>;
  updateWearerSession: (wearerId: string, session: Partial<KeyholderSession>) => Promise<void>;
  updateGroupSettings: (settings: Partial<GroupSettings>) => Promise<void>;
  getWearerById: (wearerId: string) => WearerInfo | undefined;
  canWearerPerformAction: (wearerId: string, permission: WearerPermission) => boolean;
  getActiveWearers: () => WearerInfo[];
  isAtMaxCapacity: () => boolean;
}

const DEFAULT_GROUP_SETTINGS: GroupSettings = {
  allowCrossWearerTasks: false,
  sharedRewards: false,
  requireAllApproval: true,
  maxWearers: 5
};

export function useMultiWearer({
  userId,
  isAuthReady,
  saveDataToFirestore,
  initialData
}: UseMultiWearerProps): UseMultiWearerReturn {

  const [multiWearerData, setMultiWearerData] = useState<MultiWearerData>({
    wearers: [],
    activeWearerId: undefined,
    groupSettings: DEFAULT_GROUP_SETTINGS,
    ...initialData
  });

  // Update state when initial data changes
  useEffect(() => {
    if (initialData) {
      setMultiWearerData(prev => ({
        ...prev,
        ...initialData,
        groupSettings: { ...DEFAULT_GROUP_SETTINGS, ...initialData.groupSettings }
      }));
    }
  }, [initialData]);

  const generateWearerId = useCallback((): string => {
    return `wearer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const getWearerById = useCallback((wearerId: string): WearerInfo | undefined => {
    return multiWearerData.wearers.find(wearer => wearer.id === wearerId);
  }, [multiWearerData.wearers]);

  const getActiveWearers = useCallback((): WearerInfo[] => {
    return multiWearerData.wearers.filter(wearer => wearer.status === 'active');
  }, [multiWearerData.wearers]);

  const isAtMaxCapacity = useCallback((): boolean => {
    const activeWearers = getActiveWearers();
    return activeWearers.length >= multiWearerData.groupSettings.maxWearers;
  }, [getActiveWearers, multiWearerData.groupSettings.maxWearers]);

  const canWearerPerformAction = useCallback((wearerId: string, permission: WearerPermission): boolean => {
    const wearer = getWearerById(wearerId);
    if (!wearer || wearer.status !== 'active') return false;
    
    return wearer.permissions.includes(permission);
  }, [getWearerById]);

  const activeWearer = multiWearerData.activeWearerId 
    ? getWearerById(multiWearerData.activeWearerId) 
    : undefined;

  const addWearer = useCallback(async (wearerInfo: Omit<WearerInfo, 'id' | 'joinedAt'>): Promise<string> => {
    if (!isAuthReady || !userId) {
      throw new Error('User not authenticated');
    }

    if (isAtMaxCapacity()) {
      throw new Error(`Maximum number of wearers (${multiWearerData.groupSettings.maxWearers}) reached`);
    }

    const newWearerId = generateWearerId();
    const newWearer: WearerInfo = {
      ...wearerInfo,
      id: newWearerId,
      joinedAt: Timestamp.now()
    };

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      wearers: [...multiWearerData.wearers, newWearer]
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);

    return newWearerId;
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData, isAtMaxCapacity, generateWearerId]);

  const removeWearer = useCallback(async (wearerId: string): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updatedWearers = multiWearerData.wearers.filter(wearer => wearer.id !== wearerId);
    const updatedData: MultiWearerData = {
      ...multiWearerData,
      wearers: updatedWearers,
      // Reset active wearer if they were removed
      activeWearerId: multiWearerData.activeWearerId === wearerId ? undefined : multiWearerData.activeWearerId
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData]);

  const setActiveWearer = useCallback(async (wearerId: string): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const wearer = getWearerById(wearerId);
    if (!wearer || wearer.status !== 'active') {
      throw new Error('Cannot set inactive or non-existent wearer as active');
    }

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      activeWearerId: wearerId
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData, getWearerById]);

  const updateWearerStatus = useCallback(async (wearerId: string, status: WearerInfo['status']): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updatedWearers = multiWearerData.wearers.map(wearer =>
      wearer.id === wearerId ? { ...wearer, status } : wearer
    );

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      wearers: updatedWearers,
      // Clear active wearer if they become inactive
      activeWearerId: (multiWearerData.activeWearerId === wearerId && status !== 'active') 
        ? undefined 
        : multiWearerData.activeWearerId
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData]);

  const updateWearerPermissions = useCallback(async (wearerId: string, permissions: WearerPermission[]): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updatedWearers = multiWearerData.wearers.map(wearer =>
      wearer.id === wearerId ? { ...wearer, permissions } : wearer
    );

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      wearers: updatedWearers
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData]);

  const updateWearerSession = useCallback(async (wearerId: string, session: Partial<KeyholderSession>): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updatedWearers = multiWearerData.wearers.map(wearer =>
      wearer.id === wearerId 
        ? { ...wearer, currentSession: { ...wearer.currentSession, ...session } }
        : wearer
    );

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      wearers: updatedWearers
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData]);

  const updateGroupSettings = useCallback(async (settings: Partial<GroupSettings>): Promise<void> => {
    if (!isAuthReady || !userId) return;

    const updatedData: MultiWearerData = {
      ...multiWearerData,
      groupSettings: { ...multiWearerData.groupSettings, ...settings }
    };

    await saveDataToFirestore({ multiWearerData: updatedData });
    setMultiWearerData(updatedData);
  }, [userId, isAuthReady, saveDataToFirestore, multiWearerData]);

  return {
    multiWearerData,
    activeWearer,
    addWearer,
    removeWearer,
    setActiveWearer,
    updateWearerStatus,
    updateWearerPermissions,
    updateWearerSession,
    updateGroupSettings,
    getWearerById,
    canWearerPerformAction,
    getActiveWearers,
    isAtMaxCapacity
  };
}
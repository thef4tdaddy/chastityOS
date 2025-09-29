import { 
  useAdminSession, 
  useKeyholderRewards, 
  useKeyholderSession, 
  useMultiWearer 
} from '../../hooks/keyholder';
import { KeyholderReward, KeyholderPunishment } from '../../types';

import { TaskData } from '../../types';

interface TypedKeyholderDemoProps {
  userId: string;
  isAuthReady: boolean;
  addTask: (taskData: TaskData) => Promise<void>;
  saveDataToFirestore: (data: Record<string, unknown>) => Promise<void>;
  requiredKeyholderDurationSeconds: number;
}

/**
 * Demo component showing how the new TypeScript keyholder hooks work
 * This replaces the need for 'any' types with proper TypeScript interfaces
 */
export function TypedKeyholderDemo({
  userId,
  isAuthReady,
  addTask,
  saveDataToFirestore,
  requiredKeyholderDurationSeconds,
}: TypedKeyholderDemoProps): React.JSX.Element {
  // Admin session management with proper typing
  const {
    isAdmin,
    permissions: adminPermissions,
  } = useAdminSession({ userId, isAuthReady });

  // Keyholder session management with proper typing
  const {
    keyholderSession,
    isActive: isKeyholderActive,
  } = useKeyholderSession({ userId, isAuthReady, keyholderName: 'Demo Keyholder' });

  // Rewards and punishments with proper typing
  const {
    addReward,
    addPunishment,
  } = useKeyholderRewards({
    userId,
    addTask,
    saveDataToFirestore,
    requiredKeyholderDurationSeconds,
  });

  // Multi-wearer functionality with proper typing
  const {
    session: multiWearerSession,
    wearers,
  } = useMultiWearer({ keyholderUserId: userId, isAuthReady });

  // Example of properly typed reward
  const handleAddTypedReward = async (): Promise<void> => {
    const reward: KeyholderReward = {
      type: 'time',
      timeSeconds: 3600, // 1 hour
      note: 'Good behavior reward',
    };
    
    try {
      await addReward(reward);
    } catch (error) {
      console.error('Error adding reward:', error);
    }
  };

  // Example of properly typed punishment
  const handleAddTypedPunishment = async (): Promise<void> => {
    const punishment: KeyholderPunishment = {
      type: 'time',
      timeSeconds: 1800, // 30 minutes
      note: 'Minor infraction',
    };
    
    try {
      await addPunishment(punishment);
    } catch (error) {
      console.error('Error adding punishment:', error);
    }
  };

  return (
    <div className="typed-keyholder-demo p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">TypeScript Keyholder Demo</h3>
      
      <div className="space-y-4">
        {/* Admin Session Status */}
        <div className="admin-status">
          <h4 className="font-medium">Admin Session</h4>
          <p>Status: {isAdmin ? 'Active' : 'Inactive'}</p>
          {adminPermissions && (
            <p>Permissions: {Object.keys(adminPermissions).filter(
              key => adminPermissions[key as keyof typeof adminPermissions]
            ).join(', ')}</p>
          )}
        </div>

        {/* Keyholder Session Status */}
        <div className="keyholder-status">
          <h4 className="font-medium">Keyholder Session</h4>
          <p>Status: {isKeyholderActive ? 'Active' : 'Inactive'}</p>
          {keyholderSession && (
            <p>Keyholder: {keyholderSession.keyholderName}</p>
          )}
        </div>

        {/* Multi-Wearer Status */}
        <div className="multi-wearer-status">
          <h4 className="font-medium">Multi-Wearer Session</h4>
          <p>Active: {multiWearerSession?.isActive ? 'Yes' : 'No'}</p>
          <p>Wearers: {wearers.length}</p>
        </div>

        {/* Demo Actions */}
        <div className="demo-actions space-x-2">
          <button 
            onClick={handleAddTypedReward}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Typed Reward
          </button>
          
          <button 
            onClick={handleAddTypedPunishment}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Add Typed Punishment
          </button>
        </div>
      </div>
    </div>
  );
}
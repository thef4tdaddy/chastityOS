import { Timestamp, FieldValue } from 'firebase/firestore';

// Base interfaces for keyholder functionality
export interface KeyholderReward {
  type: 'time' | 'note';
  value: number | string;
}

export interface KeyholderPunishment {
  type: 'time' | 'note'; 
  value: number | string;
}

export interface Task {
  id: string;
  text: string;
  deadline?: Date | null;
  reward?: KeyholderReward;
  punishment?: KeyholderPunishment;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  assignedBy: 'keyholder' | 'user';
  createdAt: Timestamp | FieldValue;
}

export interface LogEntry {
  logType: 'reward' | 'punishment' | 'task' | 'session';
  sourceText: string;
  note?: string;
  timeChangeSeconds?: number;
  createdAt: Timestamp | FieldValue;
}

export interface KeyholderSession {
  isKeyholderControlsLocked?: boolean;
  requiredKeyholderDurationSeconds?: number;
  keyholderName?: string;
  keyholderPasswordHash?: string;
  lastActivity?: Timestamp;
  adminSession?: AdminSessionData;
  multiWearerData?: MultiWearerData;
}

export interface AdminSessionData {
  isAdminModeActive: boolean;
  adminSessionStartTime?: Timestamp;
  adminPermissions: AdminPermission[];
  sessionTimeout?: number;
}

export type AdminPermission = 
  | 'manage_users'
  | 'view_sessions' 
  | 'modify_durations'
  | 'delete_tasks'
  | 'emergency_unlock';

export interface MultiWearerData {
  wearers: WearerInfo[];
  activeWearerId?: string;
  groupSettings: GroupSettings;
}

export interface WearerInfo {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: Timestamp;
  permissions: WearerPermission[];
  currentSession?: Partial<KeyholderSession>;
}

export type WearerPermission = 
  | 'view_others'
  | 'assign_tasks'
  | 'manage_rewards';

export interface GroupSettings {
  allowCrossWearerTasks: boolean;
  sharedRewards: boolean;
  requireAllApproval: boolean;
  maxWearers: number;
}

export interface RewardData {
  timeSeconds?: number;
  other?: string;
  type: 'manual' | 'task_completion' | 'goal_achievement';
  amount?: number;
  description?: string;
}

export interface PunishmentData {
  timeSeconds?: number;
  other?: string;
  type: 'manual' | 'task_failure' | 'rule_violation';
  amount?: number;
  description?: string;
}

// Hook return types
export interface KeyholderHandlers {
  handleLockKeyholderControls: () => Promise<void>;
  handleSetRequiredDuration: (duration: number) => Promise<void>;
  handleAddReward: (reward: RewardData) => Promise<void>;
  handleAddPunishment: (punishment: PunishmentData) => Promise<void>;
  handleAddTask: (taskData: Partial<Task>) => Promise<void>;
  handleApproveTask: (taskId: string) => Promise<void>;
  handleRejectTask: (taskId: string) => Promise<void>;
}

export interface SaveDataFunction {
  (data: Record<string, unknown>): Promise<void>;
}

export interface AddTaskFunction {
  (taskData: Partial<Task> | LogEntry): Promise<void>;
}

export interface UpdateTaskFunction {
  (taskId: string, updates: Partial<Task>): Promise<void>;
}
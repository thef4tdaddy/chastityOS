/**
 * Contexts index
 * Exports all React contexts and related hooks
 */

// Auth Context
export {
  AuthProvider,
  useAuth,
  useAuthState,
  useAuthActions,
} from "./AuthContext";
export type { AuthState, AuthActions, AuthContextType } from "./AuthContext";

// App Context
export {
  AppProvider,
  useApp,
  useAppState,
  useAppActions,
  useConnectionStatus,
  useSyncStatus,
} from "./AppContext";
export type { AppState, AppActions, AppContextType } from "./AppContext";

// Toast Context
export { ToastProvider, useToast } from "./ToastProvider";
export type { ToastContextValue, ToastOptions } from "./ToastProvider";

// Sync Context
export { SyncProvider, useSyncContext } from "./SyncContext";

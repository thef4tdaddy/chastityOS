/**
 * Stores index
 * Exports all Zustand stores for UI state management
 *
 * Architecture: Firebase ↔ Dexie ↔ TanStack Query ↔ Components
 *                                         ↑
 *                                   Zustand (UI State Only)
 */

// Navigation Store - Page routing, breadcrumbs, mobile menu
export {
  useNavigationStore,
  useCurrentPage,
  useBreadcrumbs,
  useIsMobileMenuOpen,
  useIsPageLoading,
} from "./navigationStore";

// Modal Store - Modal visibility, content, confirmation dialogs
export {
  useModalStore,
  useModal,
  useIsModalOpen,
  useConfirmModal,
  MODAL_IDS,
} from "./modalStore";

// UI Preferences Store - Theme, animations, layout settings
export {
  useUIPreferencesStore,
  useTheme,
  useAnimations,
  useCompactMode,
  useSidebarCollapsed,
  useHighContrast,
  useFontSize,
  useShowDebugInfo,
  useShowPerformanceMetrics,
  useThemeEffect,
  useSystemThemeListener,
} from "./uiPreferencesStore";

// Notification Store - Toast messages, alerts, temporary UI feedback
export {
  useNotificationStore,
  useNotifications,
  useNotificationActions,
  useErrorHandler,
  useSuccessHandler,
} from "./notificationStore";

// Keyholder Store - Specialized business logic (existing)
export { useKeyholderStore } from "./keyholderStore";
export type {
  KeyholderState,
  KeyholderActions,
  KeyholderStore,
} from "./keyholderStore";

// Types
export type { NavigationState } from "./navigationStore";
export type { ModalState, ModalConfig } from "./modalStore";
export type { UIPreferencesState } from "./uiPreferencesStore";
export type { NotificationState, Notification } from "./notificationStore";

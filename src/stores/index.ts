/**
 * Stores index
 * Exports all Zustand stores for UI state management
 *
 * Architecture: Firebase ↔ Dexie ↔ TanStack Query ↔ Components
 *                                         ↑
 *                                   Zustand (UI State Only)
 */

// Keyholder Store - Specialized business logic (existing)
export { useKeyholderStore } from "./keyholderStore";
export type {
  KeyholderState,
  KeyholderActions,
  KeyholderStore,
} from "./keyholderStore";

// Navigation Store - Page routing, breadcrumbs, mobile menu
export {
  useNavigationStore,
  useCurrentPage,
  useBreadcrumbs,
  useIsMobileMenuOpen,
  useIsPageLoading,
} from "./navigationStore";
export type {
  NavigationState,
  NavigationActions,
  NavigationStore,
  BreadcrumbItem,
} from "./navigationStore";

// Modal Store - Modal visibility, content, confirmation dialogs
export {
  useModalStore,
  useModal,
  useIsModalOpen,
  useConfirmModal,
  MODAL_IDS,
} from "./modalStore";
export type {
  ModalState,
  ModalActions,
  ModalStore,
  ModalConfig,
} from "./modalStore";

// Notification Store - Toast messages, alerts, temporary UI feedback
export {
  useNotificationStore,
  useNotifications,
  useNotificationActions,
  useErrorHandler,
  useSuccessHandler,
} from "./notificationStore";
export type {
  NotificationState,
  NotificationActions,
  NotificationStore,
  NotificationConfig,
  NotificationType,
  NotificationAction,
} from "./notificationStore";

// Form Store - Form state, validation, dirty tracking
export {
  useFormStore,
  useForm,
  useFormField,
  useFormActions,
  useFormManager,
} from "./formStore";
export type { FormState, FormField } from "./formStore";

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
export type { UIPreferencesState } from "./uiPreferencesStore";

// Theme Store
export { useThemeStore } from "./themeStore";
export type {
  ThemeState,
  ThemeActions,
  ThemeStore,
  ThemeMode,
  ColorScheme,
  FontSize,
  AnimationSpeed,
} from "./themeStore";

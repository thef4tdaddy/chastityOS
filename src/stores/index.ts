/**
 * Stores index
 * Exports all Zustand stores
 */

// Keyholder Store
export { useKeyholderStore } from "./keyholderStore";
export type {
  KeyholderState,
  KeyholderActions,
  KeyholderStore,
} from "./keyholderStore";

// Navigation Store
export { useNavigationStore } from "./navigationStore";
export type {
  NavigationState,
  NavigationActions,
  NavigationStore,
  BreadcrumbItem,
} from "./navigationStore";

// Modal Store
export { useModalStore } from "./modalStore";
export type {
  ModalState,
  ModalActions,
  ModalStore,
  ModalConfig,
} from "./modalStore";

// Notification Store
export { useNotificationStore } from "./notificationStore";
export type {
  NotificationState,
  NotificationActions,
  NotificationStore,
  NotificationConfig,
  NotificationType,
  NotificationAction,
} from "./notificationStore";

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

// TODO: Form Store (draft data, validation states)
// TODO: Keyboard shortcut store
// TODO: Search/filter stores

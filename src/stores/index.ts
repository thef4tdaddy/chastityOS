/**
 * Stores index
 * Exports all Zustand stores
 *
 * Note: Minimal implementation - full store architecture will be
 * implemented after Firebase redesign (#101) and data layer changes (#93-95)
 */

// Keyholder Store (example implementation)
export { useKeyholderStore } from "./keyholderStore";
export type {
  KeyholderState,
  KeyholderActions,
  KeyholderStore,
} from "./keyholderStore";

// TODO: Additional stores to be implemented after architectural changes
// - UI Store (modals, navigation, loading states)
// - Navigation Store (page routing, breadcrumbs)
// - Form Store (draft data, validation states)
// - Preferences Store (theme, layout, local settings)

/**
 * Modal Store - UI Interaction State
 * Manages modal visibility, content, and confirmation dialogs
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ModalConfig {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closable?: boolean;
  [key: string]: any; // Additional props for specific modals
}

export interface ModalState {
  // Modal registry
  modals: Record<string, ModalConfig>;

  // Actions
  openModal: (id: string, config?: Partial<ModalConfig>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;

  // Utility methods
  isModalOpen: (id: string) => boolean;
  getModal: (id: string) => ModalConfig | undefined;
}

export const useModalStore = create<ModalState>()(
  devtools(
    (set, get) => ({
      // Initial state
      modals: {},

      // Actions
      openModal: (id: string, config: Partial<ModalConfig> = {}) =>
        set(
          (state) => ({
            modals: {
              ...state.modals,
              [id]: {
                isOpen: true,
                size: "md",
                closable: true,
                ...config,
              },
            },
          }),
          false,
          `openModal:${id}`,
        ),

      closeModal: (id: string) =>
        set(
          (state) => ({
            modals: {
              ...state.modals,
              [id]: {
                ...state.modals[id],
                isOpen: false,
              },
            },
          }),
          false,
          `closeModal:${id}`,
        ),

      closeAllModals: () =>
        set(
          (state) => {
            const updatedModals = { ...state.modals };
            Object.keys(updatedModals).forEach((id) => {
              updatedModals[id] = {
                ...updatedModals[id],
                isOpen: false,
              };
            });
            return { modals: updatedModals };
          },
          false,
          "closeAllModals",
        ),

      updateModal: (id: string, updates: Partial<ModalConfig>) =>
        set(
          (state) => ({
            modals: {
              ...state.modals,
              [id]: {
                ...state.modals[id],
                ...updates,
              },
            },
          }),
          false,
          `updateModal:${id}`,
        ),

      // Utility methods
      isModalOpen: (id: string) => {
        const modal = get().modals[id];
        return modal?.isOpen ?? false;
      },

      getModal: (id: string) => {
        return get().modals[id];
      },
    }),
    {
      name: "modal-store",
    },
  ),
);

// Common modal IDs as constants to prevent typos
export const MODAL_IDS = {
  CONFIRM_DELETE: "confirmDelete",
  CONFIRM_END_SESSION: "confirmEndSession",
  TASK_DETAILS: "taskDetails",
  EVENT_DETAILS: "eventDetails",
  SETTINGS_RESET: "settingsReset",
  ACCOUNT_LINKING: "accountLinking",
  PRIVACY_POLICY: "privacyPolicy",
  TERMS_OF_SERVICE: "termsOfService",
  HELP: "help",
} as const;

// Selector hooks for better performance
export const useModal = (id: string) =>
  useModalStore((state) => state.modals[id]);

export const useIsModalOpen = (id: string) =>
  useModalStore((state) => state.isModalOpen(id));

// Utility hooks for common modal patterns
export const useConfirmModal = () => {
  const { openModal, closeModal } = useModalStore();

  const openConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel",
  ) => {
    openModal(MODAL_IDS.CONFIRM_DELETE, {
      title,
      content: message,
      onConfirm: () => {
        onConfirm();
        closeModal(MODAL_IDS.CONFIRM_DELETE);
      },
      onCancel: () => closeModal(MODAL_IDS.CONFIRM_DELETE),
      confirmText,
      cancelText,
    });
  };

  return { openConfirmModal };
};

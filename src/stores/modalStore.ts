/**
 * Modal Store
 * UI state management for all modal interactions
 * Zustand store - handles modal visibility, content, and interactions
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("ModalStore");

export interface ModalConfig {
  id: string;
  isOpen: boolean;
  title?: string | undefined;
  size?: "sm" | "md" | "lg" | "xl" | "full" | undefined;
  closable?: boolean | undefined;
  overlay?: boolean | undefined;
  persistent?: boolean | undefined; // Cannot be closed by clicking overlay or pressing escape
  zIndex?: number | undefined;
  onClose?: (() => void) | undefined;
  onOpen?: (() => void) | undefined;
  data?: Record<string, any> | undefined; // Additional data for the modal
}

export interface ModalState {
  modals: Record<string, ModalConfig>;
  modalStack: string[]; // Track modal opening order for z-index management
  isAnyModalOpen: boolean;
}

export interface ModalActions {
  // Modal management
  openModal: (id: string, config?: Partial<ModalConfig>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  closeTopModal: () => void;

  // Modal configuration
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
  setModalData: (id: string, data: Record<string, any>) => void;

  // Modal queries
  isModalOpen: (id: string) => boolean;
  getModal: (id: string) => ModalConfig | undefined;
  getTopModal: () => ModalConfig | undefined;

  // Reset
  resetStore: () => void;
}

export interface ModalStore extends ModalState, ModalActions {}

const initialState: ModalState = {
  modals: {},
  modalStack: [],
  isAnyModalOpen: false,
};

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Modal management
      openModal: (id: string, config: Partial<ModalConfig> = {}) => {
        const { modals, modalStack } = get();

        const modalConfig: ModalConfig = {
          id,
          isOpen: true,
          size: "md",
          closable: true,
          overlay: true,
          persistent: false,
          zIndex: 1000 + modalStack.length,
          ...config,
        };

        // Call onOpen callback if provided
        if (modalConfig.onOpen) {
          try {
            modalConfig.onOpen();
          } catch (error) {
            logger.error("Error in modal onOpen callback", {
              modalId: id,
              error: error as Error,
            });
          }
        }

        const newModals = { ...modals, [id]: modalConfig };
        const newModalStack = modalStack.includes(id)
          ? modalStack
          : [...modalStack, id];

        set({
          modals: newModals,
          modalStack: newModalStack,
          isAnyModalOpen: true,
        });

        logger.debug("Modal opened", { modalId: id, config: modalConfig });
      },

      closeModal: (id: string) => {
        const { modals, modalStack } = get();

        if (!modals[id] || !modals[id].isOpen) {
          logger.warn("Attempted to close modal that is not open", {
            modalId: id,
          });
          return;
        }

        // Check if modal is persistent
        if (modals[id].persistent) {
          logger.debug("Cannot close persistent modal", { modalId: id });
          return;
        }

        // Call onClose callback if provided
        if (modals[id].onClose) {
          try {
            modals[id].onClose!();
          } catch (error) {
            logger.error("Error in modal onClose callback", {
              modalId: id,
              error: error as Error,
            });
          }
        }

        const newModals = { ...modals };
        delete newModals[id];

        const newModalStack = modalStack.filter((modalId) => modalId !== id);
        const isAnyModalOpen = newModalStack.length > 0;

        set({
          modals: newModals,
          modalStack: newModalStack,
          isAnyModalOpen,
        });

        logger.debug("Modal closed", { modalId: id });
      },

      closeAllModals: () => {
        const { modals } = get();

        // Call onClose callbacks for all closable modals
        Object.values(modals).forEach((modal) => {
          if (!modal.persistent && modal.onClose) {
            try {
              modal.onClose();
            } catch (error) {
              logger.error("Error in modal onClose callback during closeAll", {
                modalId: modal.id,
                error: error as Error,
              });
            }
          }
        });

        // Only close non-persistent modals
        const persistentModals = Object.fromEntries(
          Object.entries(modals).filter(([_, modal]) => modal.persistent),
        );

        const persistentStack = Object.keys(persistentModals);
        const isAnyModalOpen = persistentStack.length > 0;

        set({
          modals: persistentModals,
          modalStack: persistentStack,
          isAnyModalOpen,
        });

        logger.debug("All modals closed", {
          persistentRemaining: persistentStack.length,
        });
      },

      closeTopModal: () => {
        const { modalStack } = get();

        if (modalStack.length === 0) {
          logger.debug("No modals to close");
          return;
        }

        const topModalId = modalStack[modalStack.length - 1];
        get().closeModal(topModalId);
      },

      // Modal configuration
      updateModal: (id: string, updates: Partial<ModalConfig>) => {
        const { modals } = get();

        if (!modals[id]) {
          logger.warn("Attempted to update non-existent modal", {
            modalId: id,
          });
          return;
        }

        const updatedModal = { ...modals[id], ...updates };
        const newModals = { ...modals, [id]: updatedModal };

        set({ modals: newModals });

        logger.debug("Modal updated", { modalId: id, updates });
      },

      setModalData: (id: string, data: Record<string, any>) => {
        get().updateModal(id, { data });
      },

      // Modal queries
      isModalOpen: (id: string) => {
        const { modals } = get();
        return modals[id]?.isOpen ?? false;
      },

      getModal: (id: string) => {
        const { modals } = get();
        return modals[id];
      },

      getTopModal: () => {
        const { modals, modalStack } = get();

        if (modalStack.length === 0) {
          return undefined;
        }

        const topModalId = modalStack[modalStack.length - 1];
        return modals[topModalId];
      },

      // Reset
      resetStore: () => {
        const { modals } = get();

        // Call onClose callbacks for all modals
        Object.values(modals).forEach((modal) => {
          if (modal.onClose) {
            try {
              modal.onClose();
            } catch (error) {
              logger.error("Error in modal onClose callback during reset", {
                modalId: modal.id,
                error: error as Error,
              });
            }
          }
        });

        set(initialState);
        logger.debug("Modal store reset to initial state");
      },
    }),
    {
      name: "modal-store",
      // Only enable devtools in development
      enabled:
        import.meta.env.MODE === "development" ||
        import.meta.env.MODE === "nightly",
    },
  ),
);

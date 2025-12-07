import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarTab: 'project' | 'characters' | 'episodes' | 'settings';

  // Modal
  activeModal: string | null;
  modalData: any;

  // Toast notifications
  toasts: Toast[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Editor state
  selectedPanelId: string | null;
  selectedCharacterId: string | null;
  selectedEpisodeId: string | null;
  viewMode: 'edit' | 'preview' | 'split';
  zoom: number;

  // Actions
  toggleSidebar: () => void;
  setSidebarTab: (tab: 'project' | 'characters' | 'episodes' | 'settings') => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setSelectedPanel: (id: string | null) => void;
  setSelectedCharacter: (id: string | null) => void;
  setSelectedEpisode: (id: string | null) => void;
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  setZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    sidebarOpen: true,
    sidebarTab: 'project',
    activeModal: null,
    modalData: null,
    toasts: [],
    globalLoading: false,
    loadingMessage: '',
    selectedPanelId: null,
    selectedCharacterId: null,
    selectedEpisodeId: null,
    viewMode: 'edit',
    zoom: 100,

    toggleSidebar: () => {
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      });
    },

    setSidebarTab: (tab) => {
      set((state) => {
        state.sidebarTab = tab;
        state.sidebarOpen = true;
      });
    },

    openModal: (modalId, data = null) => {
      set((state) => {
        state.activeModal = modalId;
        state.modalData = data;
      });
    },

    closeModal: () => {
      set((state) => {
        state.activeModal = null;
        state.modalData = null;
      });
    },

    addToast: (toast) => {
      const id = Date.now().toString();
      set((state) => {
        state.toasts.push({ ...toast, id });
      });

      // Auto remove after duration
      const duration = toast.duration || 3000;
      setTimeout(() => {
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== id);
        });
      }, duration);
    },

    removeToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      });
    },

    setGlobalLoading: (loading, message = '') => {
      set((state) => {
        state.globalLoading = loading;
        state.loadingMessage = message;
      });
    },

    setSelectedPanel: (id) => {
      set((state) => {
        state.selectedPanelId = id;
      });
    },

    setSelectedCharacter: (id) => {
      set((state) => {
        state.selectedCharacterId = id;
      });
    },

    setSelectedEpisode: (id) => {
      set((state) => {
        state.selectedEpisodeId = id;
      });
    },

    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode;
      });
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.min(200, Math.max(25, zoom));
      });
    },
  }))
);

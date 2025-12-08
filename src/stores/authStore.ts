import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/services/firebase/config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;

  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkConfiguration: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      error: null,
      isConfigured: false,

      initialize: () => {
        const configured = isFirebaseConfigured();
        set({ isConfigured: configured });

        if (!configured) {
          set({ isLoading: false });
          return;
        }

        const auth = getFirebaseAuth();
        if (!auth) {
          set({ isLoading: false });
          return;
        }

        onAuthStateChanged(auth, (user) => {
          set({ user, isLoading: false });
        });
      },

      checkConfiguration: () => {
        const configured = isFirebaseConfigured();
        set({ isConfigured: configured });
        return configured;
      },

      signInWithGoogle: async () => {
        const auth = getFirebaseAuth();
        const provider = getGoogleProvider();

        if (!auth || !provider) {
          set({ error: 'Firebase가 설정되지 않았습니다. 설정 페이지에서 Firebase를 설정해주세요.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await signInWithPopup(auth, provider);
        } catch (error: any) {
          console.error('Google sign in failed:', error);
          set({ error: error.message || '로그인에 실패했습니다.' });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        const auth = getFirebaseAuth();
        if (!auth) return;

        set({ isLoading: true });

        try {
          await firebaseSignOut(auth);
          set({ user: null });
        } catch (error: any) {
          console.error('Sign out failed:', error);
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'webtoon-forge-auth',
      partialize: () => ({}), // user는 Firebase에서 관리하므로 persist하지 않음
    }
  )
);

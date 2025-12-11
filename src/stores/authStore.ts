import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/services/firebase/config';
import { SyncService } from '@/services/firebase/syncService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  isConfigured: boolean;

  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkConfiguration: () => boolean;
  syncFromCloud: () => Promise<{ downloaded: number; errors: string[] }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isSyncing: false,
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

        let previousUser: User | null = null;

        onAuthStateChanged(auth, async (user) => {
          const wasLoggedOut = !previousUser;
          previousUser = user;

          set({ user, isLoading: false });

          // 로그인 시 자동으로 클라우드에서 동기화
          if (user && wasLoggedOut) {
            console.log('[Auth] 로그인 감지, 클라우드 동기화 시작...');
            try {
              const result = await get().syncFromCloud();
              console.log(`[Auth] 클라우드 동기화 완료: ${result.downloaded}개 프로젝트`);

              // 프로젝트 목록 새로고침
              const { useProjectStore } = await import('./projectStore');
              await useProjectStore.getState().loadProjects();
            } catch (error) {
              console.error('[Auth] 클라우드 동기화 실패:', error);
            }
          }
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

      syncFromCloud: async () => {
        const { user } = get();
        if (!user) {
          return { downloaded: 0, errors: ['로그인이 필요합니다.'] };
        }

        set({ isSyncing: true });

        try {
          const syncService = new SyncService(user.uid);
          const result = await syncService.syncFromCloud();
          return result;
        } catch (error: any) {
          console.error('Cloud sync failed:', error);
          return { downloaded: 0, errors: [error.message] };
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'webtoon-forge-auth',
      partialize: () => ({}), // user는 Firebase에서 관리하므로 persist하지 않음
    }
  )
);

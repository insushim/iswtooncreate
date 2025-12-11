import React, { useEffect } from 'react';
import { AppRouter } from '@/router';
import { ToastContainer } from '@/components/common';
import { useUIStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { initializeFirebase } from '@/services/firebase/config';

const App: React.FC = () => {
  const { toasts, removeToast } = useUIStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Firebase 초기화 및 인증 상태 복원
    initializeFirebase();
    initialize();
  }, [initialize]);

  return (
    <>
      <AppRouter />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default App;

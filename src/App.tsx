import React from 'react';
import { AppRouter } from '@/router';
import { ToastContainer } from '@/components/common';
import { useUIStore } from '@/stores';

const App: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <>
      <AppRouter />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default App;

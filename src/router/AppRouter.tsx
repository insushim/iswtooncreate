import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CreateProjectPage = lazy(() => import('@/pages/CreateProjectPage'));
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const PreviewPage = lazy(() => import('@/pages/PreviewPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter basename="/iswtooncreate">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Create Project */}
          <Route path="/create" element={<CreateProjectPage />} />

          {/* Editor */}
          <Route path="/editor/:projectId" element={<EditorPage />} />

          {/* Preview */}
          <Route path="/preview/:projectId" element={<PreviewPage />} />
          <Route path="/preview/:projectId/:episodeId" element={<PreviewPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;

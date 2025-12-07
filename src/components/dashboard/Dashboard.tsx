import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProjectCard } from './ProjectCard';
import { CostDashboard } from './CostDashboard';
import { Button, Skeleton } from '@/components/common';
import { useProjectStore } from '@/stores';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, loadProjects } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">내 프로젝트</h1>
            <p className="text-gray-400">AI와 함께 웹툰을 제작하세요</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/create')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            새 프로젝트
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Grid */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <Skeleton variant="rectangular" height={96} className="mb-4 rounded-lg" />
                    <Skeleton variant="text" width="70%" className="mb-2" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="40%" className="mt-4" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl border border-gray-700 border-dashed"
              >
                <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">아직 프로젝트가 없습니다</h2>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                  새 프로젝트를 만들어 AI와 함께 웹툰 제작을 시작해보세요.
                </p>
                <Button variant="primary" onClick={() => navigate('/create')}>
                  첫 프로젝트 만들기
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">통계</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">{projects.length}</p>
                  <p className="text-sm text-gray-400">총 프로젝트</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-pink-400">
                    {projects.filter((p) => p.status === 'in-progress').length}
                  </p>
                  <p className="text-sm text-gray-400">진행 중</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {projects.filter((p) => p.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-400">완료</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {projects.reduce((sum, p) => sum + (p.episodes?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-400">총 에피소드</p>
                </div>
              </div>
            </div>

            {/* Cost Dashboard */}
            <CostDashboard />

            {/* Quick Actions */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">빠른 시작</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/create')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-left transition-colors"
                >
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-white font-medium">새 웹툰 만들기</p>
                    <p className="text-gray-400 text-sm">AI와 함께 기획부터 시작</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-left transition-colors"
                >
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <p className="text-white font-medium">설정</p>
                    <p className="text-gray-400 text-sm">API 키 및 환경 설정</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

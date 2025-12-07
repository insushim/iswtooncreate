import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Badge, ProgressBar } from '@/components/common';
import type { WebtoonProject } from '@/types';
import { useProjectStore } from '@/stores';

interface ProjectCardProps {
  project: WebtoonProject;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { getProjectProgress, deleteProject } = useProjectStore();
  const progress = getProjectProgress(project.id);

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      draft: 'default',
      planning: 'info',
      'in-progress': 'warning',
      completed: 'success',
      published: 'primary',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '초안',
      planning: '기획 중',
      'in-progress': '제작 중',
      completed: '완료',
      published: '발행됨',
    };
    return labels[status] || status;
  };

  const getGenreIcon = (genre: string) => {
    const icons: Record<string, string> = {
      romance: '💕',
      action: '⚔️',
      fantasy: '🧙',
      'slice-of-life': '☕',
      thriller: '🔪',
      comedy: '😂',
      'sci-fi': '🚀',
      drama: '🎭',
      horror: '👻',
      mystery: '🔍',
    };
    return icons[genre] || '📖';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
      await deleteProject(project.id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/editor/${project.id}`)}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
    >
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-3 left-3">
          <span className="text-3xl">{getGenreIcon(project.genre)}</span>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={getStatusColor(project.status)} size="sm">
            {getStatusLabel(project.status)}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-red-500/50 text-white transition-colors"
            title="삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 truncate">{project.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 h-10">{project.briefConcept}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {project.episodes?.length || 0}/{project.episodeCount}화
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {project.characters?.length || 0}명
          </span>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">진행률</span>
            <span className="text-purple-400 font-medium">{progress.overall}%</span>
          </div>
          <ProgressBar value={progress.overall} size="sm" color="primary" />
        </div>

        {/* Date */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
          <span>생성: {formatDate(project.createdAt)}</span>
          <span>수정: {formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            <span className="text-2xl font-bold text-white">Webtoon Forge</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              내 프로젝트
            </Button>
            <Button variant="primary" onClick={() => navigate('/create')}>
              시작하기
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              AI와 함께
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                웹툰을 만들어보세요
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              기획부터 이미지 생성까지, Gemini AI가 당신의 웹툰 제작을 도와드립니다.
              복잡한 도구 없이 아이디어만으로 시작하세요.
            </p>
            <div className="flex gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/create')}
              >
                무료로 시작하기
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                둘러보기
              </Button>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-medium text-white mb-1">AI 기획</h3>
                <p className="text-sm text-gray-400">스토리와 캐릭터 자동 생성</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="font-medium text-white mb-1">이미지 생성</h3>
                <p className="text-sm text-gray-400">일관된 아트 스타일</p>
              </div>
              <div>
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-medium text-white mb-1">비용 최적화</h3>
                <p className="text-sm text-gray-400">스마트 캐싱 시스템</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sample Panels */}
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="aspect-[3/4] rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-4xl"
                    >
                      {['🎭', '⚔️', '💕', '🌟'][i - 1]}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-purple-600 rounded-xl px-4 py-2 shadow-lg"
              >
                <span className="text-white font-medium">AI Generated</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-pink-600 rounded-xl px-4 py-2 shadow-lg"
              >
                <span className="text-white font-medium">30% Cost Saved</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between text-gray-500 text-sm">
          <span>Webtoon Forge - AI Powered</span>
          <span>Gemini 2.0 Flash</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

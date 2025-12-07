import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: '대시보드', icon: '📊' },
    { path: '/create', label: '새 프로젝트', icon: '✨' },
    { path: '/settings', label: '설정', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span className="text-xl font-bold text-white">Webtoon Forge</span>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-purple-600/30 rounded-lg"
                        transition={{ type: 'spring', duration: 0.3 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Webtoon Forge - AI 기반 웹툰 제작 도구
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Powered by Gemini 2.0 Flash
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

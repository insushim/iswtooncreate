import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, Toggle, Slider, Card, Toast } from '@/components/common';
import { useCostStore } from '@/stores';
import { geminiService } from '@/services/gemini/GeminiService';
import { useAuthStore } from '@/stores/authStore';
import { saveFirebaseConfig, isFirebaseConfigured } from '@/services/firebase/config';
import { SyncService } from '@/services/firebase/syncService';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCostStore();
  const { user, isLoading: authLoading, signInWithGoogle, signOut, initialize, checkConfiguration } = useAuthStore();

  const [apiKey, setApiKey] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Firebase config state
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [isFirebaseSetup, setIsFirebaseSetup] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);

  useEffect(() => {
    // localStorage에서 저장된 API 키 불러오기
    const savedKey = geminiService.getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      // 기본 API 키가 있으면 표시 (마스킹)
      setApiKey('••••••••••••••••••••••••••••••••••••••••');
    }

    // Firebase 설정 확인
    setIsFirebaseSetup(isFirebaseConfigured());
    initialize();

    // 저장된 Firebase 설정 불러오기
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
      try {
        setFirebaseConfig(JSON.parse(savedConfig));
      } catch {}
    }
  }, [initialize]);

  const handleSave = () => {
    if (apiKey.trim()) {
      geminiService.setApiKey(apiKey.trim());
      setToast({ message: 'API 키가 저장되었습니다. 이제 AI 기능을 사용할 수 있습니다!', type: 'success' });
    } else {
      setToast({ message: '설정이 저장되었습니다', type: 'success' });
    }
  };

  const handleSaveFirebaseConfig = () => {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      setToast({ message: 'API Key와 Project ID는 필수입니다.', type: 'error' });
      return;
    }

    const success = saveFirebaseConfig(firebaseConfig);
    if (success) {
      setIsFirebaseSetup(true);
      setShowFirebaseSetup(false);
      checkConfiguration();
      setToast({ message: 'Firebase 설정이 저장되었습니다.', type: 'success' });
    } else {
      setToast({ message: 'Firebase 초기화에 실패했습니다. 설정을 확인해주세요.', type: 'error' });
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    if (useAuthStore.getState().error) {
      setToast({ message: useAuthStore.getState().error || '로그인 실패', type: 'error' });
    } else {
      setToast({ message: '로그인 성공!', type: 'success' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setToast({ message: '로그아웃되었습니다.', type: 'success' });
  };

  const handleSyncToCloud = async () => {
    if (!user) {
      setToast({ message: '먼저 로그인해주세요.', type: 'error' });
      return;
    }

    setIsSyncing(true);
    try {
      const syncService = new SyncService(user.uid);
      const result = await syncService.syncToCloud();
      if (result.errors.length > 0) {
        setToast({ message: `${result.uploaded}개 업로드, ${result.errors.length}개 실패`, type: 'error' });
      } else {
        setToast({ message: `${result.uploaded}개 프로젝트가 클라우드에 저장되었습니다.`, type: 'success' });
      }
    } catch (error: any) {
      setToast({ message: error.message || '동기화 실패', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromCloud = async () => {
    if (!user) {
      setToast({ message: '먼저 로그인해주세요.', type: 'error' });
      return;
    }

    setIsSyncing(true);
    try {
      const syncService = new SyncService(user.uid);
      const result = await syncService.syncFromCloud();
      if (result.errors.length > 0) {
        setToast({ message: `${result.downloaded}개 다운로드, ${result.errors.length}개 실패`, type: 'error' });
      } else {
        setToast({ message: `${result.downloaded}개 프로젝트를 불러왔습니다. 페이지를 새로고침해주세요.`, type: 'success' });
      }
    } catch (error: any) {
      setToast({ message: error.message || '동기화 실패', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>

        <div className="space-y-6">
          {/* API Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API 설정
            </h2>
            <div className="space-y-4">
              <Input
                label="Gemini API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                helperText={
                  !geminiService.getApiKey()
                    ? "✅ 기본 API 키 사용 중 (별도 설정 불필요)"
                    : "Google AI Studio (aistudio.google.com)에서 무료로 API 키를 발급받으세요"
                }
              />
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 font-medium mb-1">API 키 발급 방법:</p>
                <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
                  <li>Google AI Studio 접속 (aistudio.google.com)</li>
                  <li>Google 계정으로 로그인</li>
                  <li>"Get API Key" 클릭 후 키 생성</li>
                  <li>생성된 키를 위 입력란에 붙여넣기</li>
                </ol>
              </div>
              <p className="text-xs text-gray-500">
                API 키는 브라우저 로컬에만 저장되며 외부로 전송되지 않습니다.
              </p>
            </div>
          </Card>

          {/* Cloud Sync Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              클라우드 동기화
            </h2>

            {!isFirebaseSetup ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium mb-2">Firebase 설정 필요</p>
                  <p className="text-sm text-gray-400 mb-3">
                    클라우드 동기화를 사용하려면 Firebase 프로젝트가 필요합니다.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFirebaseSetup(!showFirebaseSetup)}
                  >
                    {showFirebaseSetup ? 'Firebase 설정 닫기' : 'Firebase 설정하기'}
                  </Button>
                </div>

                {showFirebaseSetup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                      <p className="text-sm text-blue-400 font-medium mb-1">Firebase 설정 방법:</p>
                      <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1">
                        <li>Firebase Console (console.firebase.google.com) 접속</li>
                        <li>새 프로젝트 생성 또는 기존 프로젝트 선택</li>
                        <li>프로젝트 설정 → 일반 → 내 앱에서 웹 앱 추가</li>
                        <li>firebaseConfig 값을 아래에 입력</li>
                        <li>Authentication에서 Google 로그인 활성화</li>
                        <li>Firestore Database 생성 (테스트 모드)</li>
                      </ol>
                    </div>

                    <Input
                      label="API Key"
                      value={firebaseConfig.apiKey}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                    />
                    <Input
                      label="Auth Domain"
                      value={firebaseConfig.authDomain}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                      placeholder="your-app.firebaseapp.com"
                    />
                    <Input
                      label="Project ID"
                      value={firebaseConfig.projectId}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                      placeholder="your-project-id"
                    />
                    <Input
                      label="Storage Bucket"
                      value={firebaseConfig.storageBucket}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                      placeholder="your-app.appspot.com"
                    />
                    <Input
                      label="Messaging Sender ID"
                      value={firebaseConfig.messagingSenderId}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, messagingSenderId: e.target.value })}
                      placeholder="123456789"
                    />
                    <Input
                      label="App ID"
                      value={firebaseConfig.appId}
                      onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                      placeholder="1:123456789:web:abc123"
                    />

                    <Button variant="primary" onClick={handleSaveFirebaseConfig}>
                      Firebase 설정 저장
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Status */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.photoURL && (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{user.displayName}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleSignOut}>
                        로그아웃
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400">로그인하여 클라우드에 프로젝트를 저장하세요</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                        loading={authLoading}
                      >
                        Google 로그인
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sync Buttons */}
                {user && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleSyncToCloud}
                      disabled={isSyncing}
                      className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-white font-medium">클라우드에 업로드</span>
                      </div>
                      <p className="text-gray-400 text-sm">로컬 프로젝트를 클라우드에 저장</p>
                    </button>

                    <button
                      onClick={handleSyncFromCloud}
                      disabled={isSyncing}
                      className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span className="text-white font-medium">클라우드에서 가져오기</span>
                      </div>
                      <p className="text-gray-400 text-sm">클라우드 프로젝트를 로컬로 복원</p>
                    </button>
                  </div>
                )}

                {isSyncing && (
                  <div className="flex items-center justify-center gap-2 p-4">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">동기화 중...</span>
                  </div>
                )}

                {/* Firebase Config Edit */}
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowFirebaseSetup(!showFirebaseSetup)}
                    className="text-sm text-gray-500 hover:text-gray-400"
                  >
                    Firebase 설정 {showFirebaseSetup ? '닫기' : '수정'}
                  </button>

                  {showFirebaseSetup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-3"
                    >
                      <Input
                        label="API Key"
                        value={firebaseConfig.apiKey}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                      />
                      <Input
                        label="Project ID"
                        value={firebaseConfig.projectId}
                        onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                      />
                      <Button variant="secondary" size="sm" onClick={handleSaveFirebaseConfig}>
                        설정 업데이트
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Cost Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              비용 설정
            </h2>
            <div className="space-y-6">
              <Slider
                label="일일 비용 한도"
                value={settings.dailyLimit}
                onChange={(value) => updateSettings({ dailyLimit: value })}
                min={1}
                max={20}
                step={0.5}
                formatValue={(v) => `$${v.toFixed(2)}`}
              />

              <Slider
                label="경고 임계값"
                value={settings.warningThreshold * 100}
                onChange={(value) => updateSettings({ warningThreshold: value / 100 })}
                min={50}
                max={95}
                step={5}
                formatValue={(v) => `${v}%`}
              />
            </div>
          </Card>

          {/* Optimization Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              최적화 설정
            </h2>
            <div className="space-y-4">
              <Toggle
                label="프로그레시브 이미지 생성"
                description="저해상도 프리뷰를 먼저 생성하여 비용을 절감합니다"
                checked={settings.enableProgressiveGeneration}
                onChange={(checked) => updateSettings({ enableProgressiveGeneration: checked })}
              />

              <Toggle
                label="시맨틱 캐싱"
                description="유사한 프롬프트의 결과를 캐싱하여 재사용합니다"
                checked={settings.enableSemanticCache}
                onChange={(checked) => updateSettings({ enableSemanticCache: checked })}
              />

              <Toggle
                label="배치 처리 우선"
                description="여러 이미지를 한 번에 처리하여 효율을 높입니다"
                checked={settings.preferBatchProcessing}
                onChange={(checked) => updateSettings({ preferBatchProcessing: checked })}
              />

              {settings.enableSemanticCache && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Slider
                    label="캐시 유사도 임계값"
                    value={settings.cacheThreshold * 100}
                    onChange={(value) => updateSettings({ cacheThreshold: value / 100 })}
                    min={70}
                    max={95}
                    step={5}
                    formatValue={(v) => `${v}%`}
                  />
                </motion.div>
              )}
            </div>
          </Card>

          {/* Data Management */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              데이터 관리
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">캐시 초기화</p>
                  <p className="text-gray-400 text-sm">이미지와 텍스트 캐시를 모두 삭제합니다</p>
                </div>
                <Button variant="danger" size="sm">
                  초기화
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">데이터 내보내기</p>
                  <p className="text-gray-400 text-sm">모든 프로젝트를 JSON으로 내보냅니다</p>
                </div>
                <Button variant="secondary" size="sm">
                  내보내기
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">데이터 가져오기</p>
                  <p className="text-gray-400 text-sm">백업 파일에서 프로젝트를 복원합니다</p>
                </div>
                <Button variant="secondary" size="sm">
                  가져오기
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

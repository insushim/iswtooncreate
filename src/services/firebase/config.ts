import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 기본 Firebase 설정
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAlf3rgKVIw6-iwlG66bJAQNiERBk8SobU",
  authDomain: "wordgame-fc059.firebaseapp.com",
  projectId: "wordgame-fc059",
  storageBucket: "wordgame-fc059.firebasestorage.app",
  messagingSenderId: "323299559321",
  appId: "1:323299559321:web:7cfb59a08c5c3d84063508",
  measurementId: "G-Q0Y95ZPLSD"
};

// Firebase 설정 가져오기 (커스텀 설정이 있으면 사용, 없으면 기본값)
const getFirebaseConfig = () => {
  const configStr = localStorage.getItem('firebase_config');
  if (configStr) {
    try {
      return JSON.parse(configStr);
    } catch {
      // 파싱 실패 시 기본값 사용
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const initializeFirebase = () => {
  const config = getFirebaseConfig();
  if (!config) return false;

  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return false;
  }
};

export const getFirebaseAuth = () => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getGoogleProvider = () => {
  if (!googleProvider) {
    initializeFirebase();
  }
  return googleProvider;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
};

export const isFirebaseConfigured = () => {
  // 기본값이 있으므로 항상 true
  return true;
};

export const saveFirebaseConfig = (config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}) => {
  localStorage.setItem('firebase_config', JSON.stringify(config));
  // 재초기화
  app = null;
  auth = null;
  db = null;
  storage = null;
  googleProvider = null;
  return initializeFirebase();
};

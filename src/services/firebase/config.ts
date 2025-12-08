import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정은 설정 페이지에서 입력받음
const getFirebaseConfig = () => {
  const configStr = localStorage.getItem('firebase_config');
  if (!configStr) return null;

  try {
    return JSON.parse(configStr);
  } catch {
    return null;
  }
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const initializeFirebase = () => {
  const config = getFirebaseConfig();
  if (!config) return false;

  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
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

export const isFirebaseConfigured = () => {
  return !!localStorage.getItem('firebase_config');
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
  googleProvider = null;
  return initializeFirebase();
};

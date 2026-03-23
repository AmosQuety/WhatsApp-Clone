import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAnCQ0bc745_BmXHIhmNrEZBLEKRUNsFE8",
  authDomain: "whatsapp-e2189.firebaseapp.com",
  projectId: "whatsapp-e2189",
  storageBucket: "whatsapp-e2189.firebasestorage.app",
  messagingSenderId: "821719888216",
  appId: "1:821719888216:web:6058939427"
};

// ─── App ──────────────────────────────────────────────────────────────────────
// getApps() persists across Metro fast refresh, so this is safe to call every
// time the module is re-evaluated.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Auth ─────────────────────────────────────────────────────────────────────
// The problem with the previous approach:
//   1. Fast refresh re-evaluates module code → initializeAuth() throws
//      "already initialized".
//   2. The catch fallback called getAuth(app), but on Android getAuth()
//      ALSO internally calls initializeAuth() → same crash, infinite loop.
//
// The fix: store the auth instance on globalThis, which survives fast refresh.
// On the first real boot, globalThis.__firebase_auth__ is undefined → we
// initialize. On every subsequent fast refresh, we reuse the existing instance
// and never call initializeAuth() again.

const FIREBASE_AUTH_KEY = '__firebase_auth__';

if (!(globalThis as any)[FIREBASE_AUTH_KEY]) {
  (globalThis as any)[FIREBASE_AUTH_KEY] = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = (globalThis as any)[FIREBASE_AUTH_KEY] as ReturnType<typeof getAuth>;

// ─── Other services ───────────────────────────────────────────────────────────
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
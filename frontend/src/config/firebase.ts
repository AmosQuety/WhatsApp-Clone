import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAnCQ0bc745_BmXHIhmNrEZBLEKRUNsFE8",
  authDomain: "whatsapp-e2189.firebaseapp.com",
  projectId: "whatsapp-e2189",
  storageBucket: "whatsapp-e2189.firebasestorage.app",
  messagingSenderId: "821719888216",
  appId: "1:821719888216:web:6058939427"
};

// Initialize Firebase App eagerly
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth: any = null;

export function getFirebaseAuth() {
  if (!_auth) {
    if (Platform.OS === 'web') {
      // For web, use standard web persistence import
      const { getAuth } = require('firebase/auth');
      _auth = getAuth(app);
    } else {
      // For native, use the StackOverflow fix that avoids the SDK 53 registry crash
      const { initializeAuth, getReactNativePersistence } = require('@firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      try {
        _auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (e: any) {
        // Fallback for fast refresh
        const { getAuth } = require('@firebase/auth');
        _auth = getAuth(app);
      }
    }
  }
  return _auth;
}

// Named exports for other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';
const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

if (fs.existsSync(absolutePath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
    console.log('Firebase Admin initialized with service account.');
  } catch (error) {
    console.warn('Failed to initialize Firebase Admin with service account:', error);
    console.warn('Firestore features will not be available.');
  }
} else {
  console.warn(`FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath}) not found. Firebase Admin not initialized.`);
  console.warn('Firestore features will be disabled. Create a service-account.json to enable them.');
}

// Exported services (will be uninitialized if config is missing)
export const db = admin.apps.length ? admin.firestore() : null as any;
export const auth = admin.apps.length ? admin.auth() : null as any;
export const storage = admin.apps.length ? admin.storage() : null as any;

// ============================================
// Firebase Configuration — Client SDK
// ============================================
// When NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set,
// the app falls back to in-memory storage (mock mode).
// This lets you develop & test without a Firebase project.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Connect to emulator in development if env var is set
  if (
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true' &&
    typeof window !== 'undefined'
  ) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch {
      // Already connected
    }
  }
}

export { app, db };
export default db;

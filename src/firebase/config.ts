import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Safe access to Vite environment variables
const env = typeof import.meta !== 'undefined' ? ((import.meta as any).env || {}) : {};

// Firebase Configuration from applet configuration, with optional runtime VITE_ env overrides
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId || '(default)',
};

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust multi-tab and offline cache support across iOS, Android, and PC
function initDb() {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  if (typeof window !== 'undefined') {
    try {
      return dbId
        ? initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          }, dbId)
        : initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          });
    } catch (e) {
      console.warn('initializeFirestore fallback to getFirestore:', e);
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
  }
  return dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = initDb();
export const auth = getAuth(app);

// Initialize Analytics conditionally
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'systemSettings', 'current'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client offline or initial connection pending:", error);
    }
    return false;
  }
}

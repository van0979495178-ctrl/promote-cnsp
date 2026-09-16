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
import firebaseConfig from '../../firebase-applet-config.json';

// Firebase Configuration from applet configuration
export { firebaseConfig };

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust multi-tab and offline cache support across iOS, Android, and PC
function initDb() {
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      }, firebaseConfig.firestoreDatabaseId);
    } catch (e) {
      console.warn('initializeFirestore fallback to getFirestore:', e);
      return getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }
  return getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

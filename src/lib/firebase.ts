// Firebase client initialization for Next.js app router
// Reads config from public env vars (NEXT_PUBLIC_*) so it can run on the client.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
// Analytics is optional; only load in browser if measurement ID present
// import { getAnalytics } from 'firebase/analytics';
import { getFirestore, type Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
// let analytics: Analytics | undefined; // Uncomment when enabling analytics

export function getFirebasePublicConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as const;
}

export function validateFirebaseConfig(): { ok: boolean; missing: string[] } {
  const cfg = getFirebasePublicConfig();
  const required: Array<keyof typeof cfg> = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter((k) => !cfg[k]);
  return { ok: missing.length === 0, missing };
}

export function getFirebaseApp(): FirebaseApp | undefined {
  // Allow SSR modules to access Firestore (Firebase supports limited server usage)
  // Only guard out analytics and auth-specific browser features elsewhere.
  if (!app) {
    const config = getFirebasePublicConfig();
    // Minimal validation (authDomain required for popup auth)
    if (!config.apiKey || !config.projectId || !config.authDomain || !config.appId) {
      if (typeof window !== 'undefined') {
        // Helpful console hint for local dev
        console.error('[Firebase] Missing config values:', validateFirebaseConfig().missing.join(', '));
      }
      return undefined;
    }

    app = getApps().length ? getApps()[0]! : initializeApp(config);
    // if (typeof window !== 'undefined' && config.measurementId) {
    //   analytics = getAnalytics(app);
    // }
  }
  return app;
}

export function getDb(): Firestore | undefined {
  if (!db) {
    const a = getFirebaseApp();
    if (!a) return undefined;
    db = getFirestore(a);
  }
  return db;
}

export function getBucket(): FirebaseStorage | undefined {
  if (!storage) {
    const a = getFirebaseApp();
    if (!a) return undefined;
    storage = getStorage(a, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  }
  return storage;
}

export function getAuthClient(): Auth | undefined {
  if (!auth) {
    const a = getFirebaseApp();
    if (!a) return undefined;
    auth = getAuth(a);
  }
  return auth;
}

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  const valid = validateFirebaseConfig();
  if (!valid.ok) {
    throw new Error(`Firebase auth is not configured. Missing: ${valid.missing.join(', ')}. Check NEXT_PUBLIC_FIREBASE_* in .env.local and ensure Auth domain is set.`);
  }
  const a = getAuthClient();
  if (!a) {
    throw new Error('Firebase failed to initialize on this page.');
  }
  const result = await signInWithPopup(a, googleProvider);
  return result.user ?? null;
}

export async function signOutUser(): Promise<void> {
  const a = getAuthClient();
  if (!a) return;
  await signOut(a);
}

export function onAuth(cb: (u: User | null) => void) {
  const a = getAuthClient();
  if (!a) return () => {};
  return onAuthStateChanged(a, cb);
}

export async function ensureUserDocument(u: User): Promise<void> {
  const database = getDb();
  if (!database) return;
  const ref = doc(database, 'users', u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: u.uid,
      displayName: u.displayName ?? null,
      photoURL: u.photoURL ?? null,
      email: u.email ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Optionally update last seen
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
  }
}

// Convenience re-export to check initialization status in UI components
export function isFirebaseReady(): boolean {
  return !!getFirebaseApp();
}

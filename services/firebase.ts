
// Use compat versions to resolve "no exported member" errors in the current environment
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

/**
 * Firebase configuration.
 * Using process.env as per environment standards in this execution context.
 * Updated to match the specific naming convention requested by the user.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase using the compat pattern to resolve environment export issues
const app = firebase.apps.length === 0 ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = firebase.auth();
export const db = firebase.firestore();

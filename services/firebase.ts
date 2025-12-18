
// Use compat versions to resolve "no exported member" errors in the current environment
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

/**
 * Firebase configuration.
 * Configurado para aceitar as chaves exatamente como definidas no ambiente do usuário.
 * Note: Em ambientes Vite padrão, variáveis sem o prefixo VITE_ podem ser filtradas.
 * Certifique-se de que seu ambiente de hospedagem (Vercel) está expondo estas chaves.
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

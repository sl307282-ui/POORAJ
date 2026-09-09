import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC8MR26eK21YfPoAGRHM-1auSlSRGQLnyU",
  authDomain: "pooroj-crm.firebaseapp.com",
  projectId: "pooroj-crm",
  storageBucket: "pooroj-crm.firebasestorage.app",
  messagingSenderId: "923022624431",
  appId: "1:923022624431:web:6ddaa3c89961af4e26b65a",
  measurementId: "G-7WCX4V4EWQ"
};

// Initialize Firebase App only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Force login on every app launch using inMemoryPersistence
const auth = initializeAuth(app, {
  persistence: inMemoryPersistence
});

const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

export { app, auth, db };

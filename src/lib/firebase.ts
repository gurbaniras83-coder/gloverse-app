import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  getAuth, 
  browserLocalPersistence, 
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-rcAQZ_FJxloz_1hRm0S_TdYuD4T9JzM",
  authDomain: "gloverse-d94dc.firebaseapp.com",
  projectId: "gloverse-d94dc",
  storageBucket: "gloverse-d94dc.firebasestorage.app",
  messagingSenderId: "481799251150",
  appId: "1:481799251150:web:8f6544715fa77d88749c9f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

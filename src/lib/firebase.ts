import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { 
  getAuth, 
  browserLocalPersistence, 
  initializeAuth,
  type Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-rcAQZ_FJxloz_1hRm0S_TdYuD4T9JzM",
  authDomain: "gloverse-d94dc.firebaseapp.com",
  projectId: "gloverse-d94dc",
  storageBucket: "gloverse-d94dc.firebasestorage.app",
  messagingSenderId: "481799251150",
  appId: "1:481799251150:web:8f6544715fa77d88749c9f"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Ensure auth is only initialized on the client
if (typeof window !== 'undefined') {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };

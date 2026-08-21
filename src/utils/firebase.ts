import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0180473431",
  appId: "1:49910017400:web:8c5476fd6fc143ac222c8d",
  apiKey: "AIzaSyDkqK_pbfeYTNx4TNkv4DrhC1LOta-XtsM",
  authDomain: "gen-lang-client-0180473431.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-sistemadeprstamo-91075f0a-7ada-44da-a191-81e96e6aa446",
  storageBucket: "gen-lang-client-0180473431.firebasestorage.app",
  messagingSenderId: "49910017400",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const loansCollection = collection(db, 'loans');
export const settingsCollection = collection(db, 'settings');

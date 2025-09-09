// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // Import for Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyAdinzjaFo1gyUOArehFT7UcEnb-dnQL8o",
  authDomain: "edconnect-9bf3e.firebaseapp.com",
  databaseURL: "https://edconnect-9bf3e-default-rtdb.firebaseio.com", // Add Realtime Database URL
  projectId: "edconnect-9bf3e",
  storageBucket: 'edconnect-9bf3e.firebasestorage.app',
  messagingSenderId: "1013054246189",
  appId: "1:1013054246189:web:0a86abb5b2a27f83d817a4",
  measurementId: "G-0NFKZFFYWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set persistence (optional)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Persistence setting error:", error);
  });

// Initialize other services
const db = getFirestore(app);
const storage = getStorage(app);
const realtimeDb = getDatabase(app); // Initialize Realtime Database

export { auth, provider, db, storage, realtimeDb }; // Export realtimeDb
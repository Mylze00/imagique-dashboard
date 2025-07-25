// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ✅ Ta config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAbswMvuB3kHMVZk2D9SeoQHBpmG9hZgwU",
  authDomain: "imagique-holding.firebaseapp.com",
  projectId: "imagique-holding",
  storageBucket: "imagique-holding.appspot.com",
  messagingSenderId: "62617776910",
  appId: "1:62617776910:web:5da1183e6e8444571a9d5f",
  measurementId: "G-TVSCD2N4V4"
};

// ⚙️ Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // 🔥 ajout important

// ✅ Exports
export { db, auth };

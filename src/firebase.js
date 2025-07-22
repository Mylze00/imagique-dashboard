// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 👉 REMPLACE ici par les vraies infos de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAbswMvuB3kHMVZk2D9SeoQHBpmG9hZgwU",
  authDomain: "imagique-holding.firebaseapp.com",
  projectId: "imagique-holding",
  storageBucket: "imagique-holding.firebasestorage.app",
  messagingSenderId: "62617776910",
  appId: "1:62617776910:web:5da1183e6e8444571a9d5f",
  measurementId: "G-TVSCD2N4V4"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
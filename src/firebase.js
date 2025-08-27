import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ✅ Configuration Firebase pour Imagique Holding
const firebaseConfig = {
  apiKey: "AIzaSyAbswMvuB3kHMVZk2D9SeoQHBpmG9hZgwU",
  authDomain: "imagique-holding.firebaseapp.com",
  projectId: "imagique-holding",
  storageBucket: "imagique-holding.firebasestorage.app",
  messagingSenderId: "62617776910",
  appId: "1:62617776910:web:5da1183e6e8444571a9d5f",
  measurementId: "G-TVSCD2N4V4",
};

// ⚙️ Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
setLogLevel("silent"); // 🔹 désactiver logs Firestore
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ Initialiser Recaptcha
export const initRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          console.log("✅ reCAPTCHA vérifié :", response);
        },
        "expired-callback": () => {
          console.warn("⚠️ reCAPTCHA expiré");
        },
      },
      auth
    );
  }
};

export { db, auth, storage };

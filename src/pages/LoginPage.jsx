// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("choose");
  const navigate = useNavigate();

  // 📱 Auth Phone OTP
  const handleSendOTP = async () => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha", {
      size: "invisible",
    });

    try {
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("verifyOtp");
      alert("📲 Code OTP envoyé");
    } catch (err) {
      alert("Erreur envoi OTP : " + err.message);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const res = await confirmationResult.confirm(otp);
      await saveUserIfFirstTime(res.user, "client");
      alert("✅ Connexion réussie");
      navigate("/");
    } catch (err) {
      alert("❌ OTP invalide");
    }
  };

  // 🔐 Auth Google
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      await saveUserIfFirstTime(res.user, "client");
      alert("✅ Connexion Google réussie");
      navigate("/");
    } catch (err) {
      alert("Erreur Google : " + err.message);
    }
  };

  // 📝 Stocker nouvel utilisateur dans Firestore
  const saveUserIfFirstTime = async (user, defaultRole) => {
    const ref = doc(db, "users", user.uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        nom: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: defaultRole,
        createdAt: new Date(),
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-indigo-700 via-purple-600 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-6 text-center text-gray-800">🔐 Connexion</h2>

        {step === "choose" && (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Se connecter avec Google
            </button>

            <hr className="my-4" />

            <input
              type="tel"
              placeholder="+243..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input w-full mb-4 border rounded p-2"
            />
            <div id="recaptcha"></div>
            <button
              onClick={handleSendOTP}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Recevoir un code OTP
            </button>
          </>
        )}

        {step === "verifyOtp" && (
          <>
            <input
              type="text"
              placeholder="Entrez le code OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="input w-full mb-4 border rounded p-2"
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Valider le code
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

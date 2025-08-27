import React, { useState } from "react";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-imagique.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const adminEmails = [
    "congoalibaba@gmail.com",
    "plilembo@gmail.com",
    "fabricekibazola@gmail.com",
  ];

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const role = adminEmails.includes(user.email) ? "admin" : "client";

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          role,
        });
      }

      localStorage.setItem("user", JSON.stringify({ ...user, role }));
      navigate("/dashboard"); // ✅ redirection vers dashboard
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const role = adminEmails.includes(user.email) ? "admin" : "client";

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || email,
          role,
        });
      }

      localStorage.setItem("user", JSON.stringify({ ...user, role }));
      navigate("/dashboard"); // ✅ redirection vers dashboard
    } catch (error) {
      console.error("Email login error:", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen overflow-hidden">
      {/* Background Gradient & bubbles */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-black via-yellow-400 to-pink-500 animate-gradient" />
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="bubble absolute bg-white opacity-20 rounded-full"
          style={{
            width: `${Math.random() * 40 + 10}px`,
            height: `${Math.random() * 40 + 10}px`,
            left: `${Math.random() * 100}%`,
            bottom: `-${Math.random() * 100}px`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        ></div>
      ))}

      <div className="relative z-10 bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-xl shadow-lg w-96 border border-white border-opacity-20 transition-transform duration-500 ease-in-out transform hover:scale-105 neon-shadow">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Imagique" className="h-16" />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 text-white">Connexion</h2>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-2 border rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center text-white">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <span>Se souvenir de moi</span>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
          >
            Connexion avec Google
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-white text-sm opacity-70">
        Alimenté par Alibaba Group
      </div>
    </div>
  );
};

export default LoginPage;

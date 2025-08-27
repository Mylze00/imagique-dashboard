import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

const Header = () => {
  const { currentUser, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center border-b border-pink-100">
      {/* Logo / Titre */}
      <h1 className="text-2xl font-bold text-[#EC1E79]">IMAGIQUE HOLDING</h1>

      {/* Profil utilisateur */}
      <div className="relative flex items-center gap-4 text-gray-700">
        {/* Avatar */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 focus:outline-none"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profil"
              className="w-12 h-12 rounded-full border-2 border-pink-400 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-pink-200 text-pink-700 rounded-full text-xl font-bold">
              {currentUser?.displayName?.[0] || "U"}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="font-semibold">{currentUser?.displayName || "Utilisateur"}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            {role && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1">
                {role === "admin" ? "Administrateur" : "Agent"}
              </span>
            )}
          </div>
        </button>

        {/* Menu déroulant */}
        {menuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-md rounded-md w-48 py-2 z-50">
            <div className="px-4 py-2 text-gray-600 text-sm border-b">
              Connecté en tant que
              <br />
              <span className="font-semibold">{currentUser?.email}</span>
            </div>
            <button
              onClick={() => alert("Fonction Profil à implémenter")}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <FaUserCircle /> Voir Profil
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-100"
            >
              <FaSignOutAlt /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

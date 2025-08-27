import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaFileAlt, FaUsers, FaPlusSquare,
  FaMoneyBill, FaCalculator, FaBoxOpen,
  FaClipboardList, FaCrown
} from "react-icons/fa";
import logo from "../assets/logo-imagique.png";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cotationsCount, setCotationsCount] = useState(0);
  const [role, setRole] = useState(null);
  const [user] = useAuthState(auth);

  const collapseTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "cotations"));
      setCotationsCount(snap.size);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setRole(snap.data().role);
    })();
  }, [user]);

  useEffect(() => {
    return () => clearTimeout(collapseTimer.current);
  }, []);

  const handleClick = (path) => {
    navigate(path);
    onItemClick?.();
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/commandes", label: "Commandes", icon: <FaFileAlt /> },
    { path: "/ajouter-commande", label: "Ajouter", icon: <FaPlusSquare /> },
    { path: "/clients", label: "Clients", icon: <FaUsers /> },
    ...(role === "admin"
      ? [
          { path: "/finances", label: "Finances", icon: <FaMoneyBill /> },
          { path: "/admin-panel", label: "Admin Panel", icon: <FaCrown /> },
        ]
      : []),
    { path: "/cotation", label: "Cotation", icon: <FaCalculator /> },
    { path: "/cotations", label: `Cotations (${cotationsCount})`, icon: <FaClipboardList /> },
    { path: "/produits-evalues", label: "Produits", icon: <FaBoxOpen /> },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-blue-800 to-blue-900 text-white shadow z-50">
      <div className="flex gap-2 overflow-x-auto px-2 py-2 justify-center">
        {/* Menu items */}
        {menuItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleClick(path)}
              className={`flex flex-col items-center justify-center rounded transition-all duration-300 ease-in-out px-2 py-1 ${
                isActive ? "bg-white text-blue-800" : "hover:bg-white/20"
              }`}
            >
              {/* Icône responsive */}
              <span className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px]">{icon}</span>
              {/* Texte responsive */}
              <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[14px] mt-0.5 whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}

        {/* Bloc bas fixe: Déconnexion */}
        <button
          onClick={() => console.log("Déconnexion")}
          className="flex flex-col items-center justify-center rounded transition-all duration-300 ease-in-out px-2 py-1 hover:bg-white/20"
        >
          <FaUsers className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px]" />
          <span className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[14px] mt-0.5 whitespace-nowrap">
            Déconnexion
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

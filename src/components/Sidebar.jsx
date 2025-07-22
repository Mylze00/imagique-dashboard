import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaCloudUploadAlt,
  FaUsers,
  FaPlusSquare,
  FaMoneyBill,
} from "react-icons/fa";
import logo from "../assets/logo-imagique.png"; // ⚠️ Vérifie que ce fichier existe bien

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Tableau de bord", icon: <FaHome /> },
    { path: "/commandes", label: "Commandes", icon: <FaFileAlt /> },
    { path: "/ajouter-commande", label: "Ajouter commande", icon: <FaPlusSquare /> },
    { path: "/clients", label: "Clients", icon: <FaUsers /> },
    { path: "/finances", label: "Finances", icon: <FaMoneyBill /> },
  ];

  return (
    <div className="w-64 min-h-screen bg-[#12063F] text-white flex flex-col p-4 shadow-lg">
      {/* Logo + Titre */}
      <div className="flex items-center gap-3 mb-10">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold text-white">IMAGIQUE</h1>
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {menuItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2 rounded transition ${
                isActive
                  ? "bg-white text-[#12063F] font-semibold"
                  : "hover:bg-white/20"
              }`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

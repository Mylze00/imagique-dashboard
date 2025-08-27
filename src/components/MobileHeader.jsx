// src/components/MobileHeader.jsx
import React from "react";
import { FaBars } from "react-icons/fa";
import logo from "../assets/logo-imagique.png";

const MobileHeader = ({ onMenuClick }) => {
  return (
    <header className="md:hidden flex items-center justify-between bg-blue-800 text-white p-4 shadow">
      <button onClick={onMenuClick}>
        <FaBars size={24} />
      </button>
      <img src={logo} alt="Logo" className="h-8 object-contain" />
      <div className="w-6" />
    </header>
  );
};

export default MobileHeader;

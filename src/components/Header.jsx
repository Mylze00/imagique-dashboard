import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center border-b border-pink-100">
      <div className="flex items-center gap-4">
       <h1 className="text-2xl font-bold text-[#EC1E79]">IMAGIQUE HOLDING</h1>
      </div>
      <div className="text-gray-600">Bienvenue 👋</div>
    </header>
  );
};

export default Header;

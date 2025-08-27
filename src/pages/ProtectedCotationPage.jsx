import React from "react";
import { useAuth } from "../context/AuthContext";
import CotationPage from "./CotationPage";
import CotationPageAgents from "./CotationPageAgents.jsx";

const ProtectedCotationPage = () => {
  const { role } = useAuth();

  if (!role) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  return role === "admin" ? <CotationPage /> : <CotationPageAgents />;
};

export default ProtectedCotationPage;

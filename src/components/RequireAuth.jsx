// src/components/RequireAuth.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

const RequireAuth = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default RequireAuth;

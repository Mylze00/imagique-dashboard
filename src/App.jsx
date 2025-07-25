// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import ClientsPage from "./pages/ClientsPage";
import FinancesPage from "./pages/FinancesPage";
import AddOrderPage from "./pages/AddOrderPage";
import AddClientPage from "./pages/AddClientPage";
import EditClientPage from "./pages/EditClientPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/commandes"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/finances"
          element={
            <RequireAuth>
              <FinancesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/clients"
          element={
            <RequireAuth>
              <ClientsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ajouter-commande"
          element={
            <RequireAuth>
              <AddOrderPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ajouter-client"
          element={
            <RequireAuth>
              <AddClientPage />
            </RequireAuth>
          }
        />
        <Route
          path="/modifier-client/:id"
          element={
            <RequireAuth>
              <EditClientPage />
            </RequireAuth>
          }
        />

        <Route
          path="*"
          element={
            <div className="text-center text-red-600 font-bold text-2xl mt-20">
              ❌ Page non trouvée (Erreur 404)
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

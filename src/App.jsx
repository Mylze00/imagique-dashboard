import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ClientsPage from "./pages/ClientsPage";
import FinancesPage from "./pages/FinancesPage";
import AddOrderPage from "./pages/AddOrderPage";
import AddClientPage from "./pages/AddClientPage";
import EditClientPage from "./pages/EditClientPage";
import CotationPage from "./pages/CotationPage";
import ProduitsEvaluesPage from "./pages/ProduitsEvaluesPage";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Routes accessibles aux clients, agents et admin */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/commandes"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <OrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/commandes/:orderId"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <OrderDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ajouter-commande"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <AddOrderPage />
              </RequireAuth>
            }
          />
          <Route
            path="/clients"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <ClientsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/ajouter-client"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <AddClientPage />
              </RequireAuth>
            }
          />
          <Route
            path="/modifier-client/:id"
            element={
              <RequireAuth allowedRoles={["client", "agent", "admin"]}>
                <EditClientPage />
              </RequireAuth>
            }
          />

          {/* Routes accessibles uniquement aux admin */}
          <Route
            path="/finances"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <FinancesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cotation"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <CotationPage />
              </RequireAuth>
            }
          />
          <Route
            path="/produits-evalues"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <ProduitsEvaluesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <RequireAuth allowedRoles={["admin"]}>
                <AdminPanel />
              </RequireAuth>
            }
          />

          {/* 404 */}
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
    </AuthProvider>
  );
}

export default App;

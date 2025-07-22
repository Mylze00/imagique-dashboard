import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import FinancesPage from './pages/FinancesPage';
import ClientsPage from './pages/ClientsPage';
import AddOrderPage from './pages/AddOrderPage';
import AddClientPage from "./pages/AddClientPage";
import EditClientPage from './pages/EditClientPage';


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection vers Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Pages principales */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/commandes" element={<OrdersPage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/ajouter-commande" element={<AddOrderPage />} />
        <Route path="/ajouter-client" element={<AddClientPage />} />
        <Route path="/modifier-client/:id" element={<EditClientPage />} />



        {/* Fallback 404 */}
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

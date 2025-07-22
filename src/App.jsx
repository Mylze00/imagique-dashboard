import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Pages
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import FinancesPage from './pages/FinancesPage';
import ClientsPage from './pages/ClientsPage';
import AddOrderPage from './pages/AddOrderPage';
import AddClientPage from "./pages/AddClientPage";
import EditClientPage from './pages/EditClientPage';
import LoginPage from './pages/LoginPage'; // ✅ Ajout de la page Login

// 🔁 Wrapper pour navigation conditionnelle
function AppWrapper() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthChecked(true);

      if (!firebaseUser) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthChecked) return <div className="text-center p-10">🔄 Vérification utilisateur...</div>;

  return (
    <Routes>
      {/* Redirection par défaut */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth obligatoire */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/commandes" element={<OrdersPage />} />
      <Route path="/finances" element={<FinancesPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/ajouter-commande" element={<AddOrderPage />} />
      <Route path="/ajouter-client" element={<AddClientPage />} />
      <Route path="/modifier-client/:id" element={<EditClientPage />} />

      {/* Login public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Fallback */}
      <Route
        path="*"
        element={
          <div className="text-center text-red-600 font-bold text-2xl mt-20">
            ❌ Page non trouvée (Erreur 404)
          </div>
        }
      />
    </Routes>
  );
}

// 👉 App principal avec Router
function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;

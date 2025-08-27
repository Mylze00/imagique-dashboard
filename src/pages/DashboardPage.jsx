import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import OrdersChart from "../components/OrdersChart";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const { currentUser, role, loading } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "commandes"));
        const data = snapshot.docs.map(doc => {
          const raw = doc.data();
          const status = raw.status || raw.etat || "validé";
          // Calcul automatique : si livraison > 10 jours => commande livrée
          let computedStatus = status;
          const createdAtDate = raw.createdAt?.toDate ? raw.createdAt.toDate() : null;
          if (createdAtDate) {
            const estimatedDelivery = new Date(createdAtDate);
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 8); // livraison estimée
            const diffDays = Math.floor((new Date() - estimatedDelivery) / (1000 * 60 * 60 * 24));
            if (diffDays > 10) computedStatus = "receptionrdc";
          }

          return {
            id: doc.id,
            ...raw,
            status: computedStatus,
          };
        });
        setOrders(data);
      } catch (error) {
        console.error("Erreur récupération commandes :", error);
      }
    };
    fetchOrders();
  }, []);

  // Toutes les commandes non livrées
  const commandesEnCours = orders.filter(o =>
    o.status && o.status.toLowerCase() !== "receptionrdc"
  );

  const toggleLanguage = () => {
    const next = i18n.language === "fr" ? "en" : "fr";
    i18n.changeLanguage(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600 font-bold text-xl">
        ⏳ Chargement de la session...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-lg mb-4">⚠️ Session expirée</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Se reconnecter
        </button>
      </div>
    );
  }

  if (!["admin", "agent", "client"].includes(role)) {
    return (
      <div className="text-center text-red-600 font-bold text-xl mt-20">
        ❌ Accès refusé (Rôle insuffisant)
      </div>
    );
  }

  return (
    <div className="flex bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Header />
        <main className="p-4 sm:p-6 overflow-x-hidden">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">{t("dashboard")}</h1>
            <button
              onClick={toggleLanguage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              🌐 {i18n.language === "fr" ? "English" : "Français"}
            </button>
          </div>

          <StatsCards orders={orders} role={role} />

          <div className="bg-white mt-6 rounded-xl shadow p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">
              📈 {t("statistiques", { defaultValue: "Statistiques" })}
            </h2>
            <div className="max-h-[300px] overflow-hidden">
              <OrdersChart orders={orders} />
            </div>
          </div>

          <div className="bg-white mt-6 rounded-xl shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🛒 {t("orders")}</h2>
              <Link to="/commandes" className="text-blue-600 hover:underline text-sm">
                {t("voirPlus", { defaultValue: "Voir plus →" })}
              </Link>
            </div>

            <div className="hidden sm:block">
              <table className="w-full text-sm text-gray-700 table-auto">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 text-left">{t("client")}</th>
                    <th className="p-2 text-left">{t("total")}</th>
                    <th className="p-2 text-left">{t("etat", { defaultValue: "État" })}</th>
                    <th className="p-2 text-left">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => {
                    const st = order.status.toLowerCase();
                    const color =
                      st === "validé" || st === "receptionrdc"
                        ? "bg-green-400"
                        : st === "depotshenzen"
                        ? "bg-blue-600"
                        : st === "expeditionrdc"
                        ? "bg-yellow-500"
                        : "bg-gray-400";
                    return (
                      <tr key={order.id} className="border-t">
                        <td className="p-2">{order.client}</td>
                        <td className="p-2">{order.total} $</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-white text-xs ${color}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {order.createdAt?.toDate?.().toLocaleDateString() || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-2">
              {orders.slice(0, 5).map(order => {
                const st = order.status.toLowerCase();
                const color =
                  st === "validé" || st === "receptionrdc"
                    ? "bg-green-400"
                    : st === "depotshenzen"
                    ? "bg-blue-600"
                    : st === "expeditionrdc"
                    ? "bg-yellow-500"
                    : "bg-gray-400";
                return (
                  <div
                    key={order.id}
                    className="bg-blue-50 rounded-lg p-3 shadow flex flex-col text-sm"
                  >
                    <span className="font-semibold">{t("client")}:{order.client}</span>
                    <span>{t("total")}: {order.total} $</span>
                    <span>
                      {t("etat", { defaultValue: "État" })}:
                      <span className={`px-2 py-1 rounded text-white text-xs ${color}`}>
                        {order.status}
                      </span>
                    </span>
                    <span>
                      {t("date")}: {order.createdAt?.toDate?.().toLocaleDateString() || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {commandesEnCours.length > 0 && (
            <div className="mt-6">
              <marquee
                behavior="scroll"
                direction="right"
                scrollamount="5"
                className="bg-blue-600 text-white rounded shadow py-2"
              >
                {commandesEnCours.map(cmd => (
                  <span key={cmd.id} className="mx-6 text-sm">
                    🚚 {cmd.client} – {cmd.total} $ ({cmd.status})
                  </span>
                ))}
              </marquee>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateStyledPDF as generatePDF } from "../utils/generatePDF";

const steps = [
  { key: "validé", label: "Payé" },
  { key: "depotShenzen", label: "En cours" },
  { key: "expeditionRDC", label: "Prêt à être livré" },
  { key: "receptionRDC", label: "Livré" },
];

const StatusBar = ({ currentStep = "validé", percentage = 0 }) => {
  const safeStep = currentStep || "validé";
  const currentIndex = steps.findIndex((s) => s.key === safeStep);
  const stepLabel = currentIndex !== -1 ? steps[currentIndex].label : "Payé";

  return (
    <div className="flex flex-col items-center w-full max-w-[140px] mx-auto">
      <div className="relative w-full h-2 rounded bg-gray-300 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-2 rounded bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-gradient-move"
          style={{ width: `${percentage}%`, transition: "width 0.8s ease-in-out" }}
        />
      </div>
      <span className="text-[10px] sm:text-xs text-gray-500 mt-1 text-center">
        {stepLabel} ({percentage}%)
      </span>
    </div>
  );
};

const getProgressStep = (createdAt) => {
  if (!createdAt) return { step: "validé", percent: 0, daysElapsed: 0, estimatedDelivery: "—" };

  const now = new Date();
  const created = new Date(createdAt);
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  const estimatedDelivery = new Date(created);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 8);

  let step = "validé";
  let percent = 0;

  if (diffDays <= 2) {
    step = "validé";
    percent = Math.min((diffDays / 8) * 100, 20);
  } else if (diffDays <= 3) {
    step = "depotShenzen";
    percent = Math.min((diffDays / 8) * 100, 50);
  } else if (diffDays <= 8) {
    step = "expeditionRDC";
    percent = Math.min((diffDays / 8) * 100, 80);
  } else {
    step = "receptionRDC";
    percent = 100;
  }

  return {
    step,
    percent: Math.round(percent),
    daysElapsed: diffDays,
    estimatedDelivery: estimatedDelivery.toLocaleDateString(),
  };
};

const OrdersPage = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "commandes"));
        let ordersList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          const createdAtRaw = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const progress = getProgressStep(createdAtRaw);

          const now = new Date();
          let estimatedDelivery = createdAtRaw ? new Date(createdAtRaw) : null;
          if (estimatedDelivery) estimatedDelivery.setDate(estimatedDelivery.getDate() + 8);

          let currentStep = data.status || progress.step;

          if (
            estimatedDelivery &&
            currentStep !== "receptionRDC" &&
            (now - estimatedDelivery) / (1000 * 60 * 60 * 24) > 10
          ) {
            currentStep = "receptionRDC";
          }

          return {
            id: docSnap.id,
            client: data.client || "—",
            produits: data.produits || [],
            total: typeof data.total === "number" ? data.total : 0,
            createdAt: createdAtRaw ? createdAtRaw.toLocaleDateString() : "—",
            createdAtRaw,
            invoiceNumber: data.invoiceNumber?.trim() || `INV-${docSnap.id.slice(0, 6)}`,
            currentStep,
            progressPercent: currentStep === "receptionRDC" ? 100 : progress.percent,
            daysElapsed: progress.daysElapsed,
            estimatedDelivery: estimatedDelivery ? estimatedDelivery.toLocaleDateString() : "—",
            addedBy: data.addedBy || "—",
          };
        });

        ordersList.sort((a, b) => (b.createdAtRaw || 0) - (a.createdAtRaw || 0));
        setOrders(ordersList);
      } catch (error) {
        alert("❌ Erreur chargement commandes : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Supprimer cette commande ?")) return;
    try {
      await deleteDoc(doc(db, "commandes", id));
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("✅ Commande supprimée");
    } catch (error) {
      alert("❌ Erreur suppression : " + error.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">📦 Commandes</h2>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
          >
            ⬅ Accueil
          </button>
          <button
            onClick={() => navigate("/ajouter-commande")}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande enregistrée.</p>
      ) : (
        <div className="bg-white rounded shadow">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-2 sm:p-3">Commande</th>
                  <th className="p-2 sm:p-3">Client</th>
                  <th className="p-2 sm:p-3">Facture</th>
                  <th className="p-2 sm:p-3">Date</th>
                  <th className="p-2 sm:p-3">Livraison estimée</th>
                  <th className="p-2 sm:p-3">Progression</th>
                  <th className="p-2 sm:p-3">Total</th>
                  <th className="p-2 sm:p-3">Ajouté par</th>
                  <th className="p-2 sm:p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/commandes/${order.id}`)}
                    className={`border-b cursor-pointer hover:bg-gray-50 ${
                      order.currentStep === "receptionRDC" ? "bg-green-100" : ""
                    }`}
                  >
                    <td className="p-2 text-blue-600 relative">
                      #{order.id.slice(0, 6)}
                      {order.currentStep === "receptionRDC" && (
                        <span className="ml-1 text-green-600 font-bold text-xs">✅</span>
                      )}
                    </td>
                    <td className="p-2 font-semibold">{order.client}</td>
                    <td className="p-2">{order.invoiceNumber}</td>
                    <td className="p-2">{order.createdAt}</td>
                    <td className="p-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {order.estimatedDelivery}
                      </span>
                    </td>
                    <td className="p-2">
                      <StatusBar
                        currentStep={order.currentStep}
                        percentage={order.progressPercent}
                      />
                    </td>
                    <td className="p-2 font-bold text-xs sm:text-sm">{order.total.toFixed(2)} $</td>
                    <td className="p-2">{order.addedBy}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generatePDF(order);
                        }}
                        className="bg-purple-600 text-white px-2 py-1 rounded text-xs"
                      >
                        📄 PDF
                      </button>
                      {role === "admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(order.id);
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3 p-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`border rounded p-3 shadow-sm cursor-pointer relative ${
                  order.currentStep === "receptionRDC" ? "bg-green-100" : "bg-white"
                }`}
                onClick={() => navigate(`/commandes/${order.id}`)}
              >
                {order.currentStep === "receptionRDC" && (
                  <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    ✅ Livré
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    #{order.id.slice(0, 6)}
                  </span>
                  <span className="text-xs bg-gray-200 px-2 rounded">{order.invoiceNumber}</span>
                </div>
                <p className="text-xs mt-1">👤 {order.client}</p>
                <p className="text-xs">📅 {order.createdAt}</p>
                <p className="text-xs">
                  🚚 Livraison estimée:{" "}
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {order.estimatedDelivery}
                  </span>
                </p>
                <p className="text-xs">💰 <b>{order.total.toFixed(2)} $</b></p>
                <p className="text-xs">👤 Ajouté par: {order.addedBy}</p>
                <div className="mt-2">
                  <StatusBar
                    currentStep={order.currentStep}
                    percentage={order.progressPercent}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/commandes/${order.id}`);
                    }}
                    className="flex-1 bg-blue-500 text-white py-1 rounded text-xs"
                  >
                    🔍 Voir
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePDF(order);
                    }}
                    className="flex-1 bg-purple-600 text-white py-1 rounded text-xs"
                  >
                    📄 PDF
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(order.id);
                      }}
                      className="flex-1 bg-red-500 text-white py-1 rounded text-xs"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

import React, { useEffect, useState } from "react";
import { FaBoxOpen, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ETAPES = [
  "Payé",
  "Validation paiement Chine",
  "Paiement Chine",
  "Réception Chine",
  "Expédié",
  "Prêt à être livré"
];

const OrdersPage = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const snapshot = await getDocs(collection(db, "commandes"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCommandes(data);
      } catch (error) {
        console.error("Erreur de chargement :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommandes();
  }, []);

  const renderProgress = (statut) => {
    const currentStep = ETAPES.indexOf(statut);
    return (
      <div className="flex items-center justify-between text-sm text-gray-600">
        {ETAPES.map((etape, index) => (
          <div key={etape} className="flex-1 flex flex-col items-center">
            <div
              className={`w-4 h-4 rounded-full z-10 ${
                index <= currentStep ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
            <span className="mt-1 text-xs text-center px-1">{etape}</span>
            {index < ETAPES.length - 1 && (
              <div className={`h-1 w-full -mt-2 ${index < currentStep ? "bg-green-500" : "bg-gray-300"}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <FaBoxOpen className="text-2xl text-[#12063F]" />
        <h2 className="text-2xl font-bold text-[#12063F]">Commandes enregistrées</h2>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-2 bg-[#12063F] text-white px-4 py-2 rounded hover:bg-[#1e1270]"
      >
        <FaArrowLeft /> Retour au dashboard
      </button>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commandes.map((cmd) => (
            <div key={cmd.id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-[#12063F]">Client : {cmd.clientNom}</h3>
              <p className="text-sm text-gray-500 mb-2">Date : {cmd.date}</p>
              <div className="space-y-3">
                {cmd.produits?.map((prod, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-2 border rounded"
                  >
                    <img
                      src={prod.image}
                      alt={prod.designation}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{prod.designation}</h4>
                      <p className="text-sm">Prix unitaire : {prod.prixUnitaire}$</p>
                      <a
                        href={prod.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline text-sm"
                      >
                        Voir produit
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="font-medium mb-2">Statut de la commande :</p>
                {renderProgress(cmd.statut)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

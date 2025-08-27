import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaDollarSign,
  FaClock,
  FaSearch,
  FaHome,
  FaEdit,
  FaPlusCircle
} from "react-icons/fa";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClients = async () => {
    try {
      const snapshot = await getDocs(collection(db, "clients"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const uniqueClients = [];
      const seenPhones = new Set();

      for (let client of list) {
        if (!seenPhones.has(client.telephone)) {
          seenPhones.add(client.telephone);

          const commandesSnap = await getDocs(
            query(collection(db, "commandes"), where("client", "==", client.nom))
          );

          const commandesList = commandesSnap.docs.map((cmd) => ({
            id: cmd.id,
            ...cmd.data(),
          }));

          const commandesEnCours = commandesList.filter(
            (cmd) => cmd.etat && cmd.etat.toLowerCase() === "en cours"
          ).length;

          const totalPayé = commandesList.reduce(
            (sum, cmd) => sum + (cmd.total || 0),
            0
          );
          const derniereCommande =
            commandesList.length > 0
              ? commandesList
                  .map((c) => c.createdAt?.toDate?.() || new Date())
                  .sort((a, b) => b - a)[0]
                  .toLocaleDateString()
              : "—";

          uniqueClients.push({
            ...client,
            commandes: commandesList.length,
            commandesEnCours,
            total: totalPayé.toFixed(2) + " $",
            derniere: derniereCommande,
          });
        }
      }

      setClients(uniqueClients);
    } catch (error) {
      alert("❌ Erreur lors du chargement : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search)
  );

  return (
    <div className="relative min-h-screen p-4 bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header sticky */}
        <div className="sticky top-0 z-20 bg-white/20 backdrop-blur-md shadow flex justify-between items-center px-4 py-3 mb-4 rounded-lg">
          {/* Bouton Accueil */}
          <Link
            to="/dashboard"
            className="flex items-center text-white hover:text-gray-200"
          >
            <FaHome className="mr-2 text-lg" /> Accueil
          </Link>

          {/* Titre */}
          <h2 className="text-lg font-bold text-left flex-1 ml-4">
            📋 Liste des clients
          </h2>

          {/* Ajouter client à droite */}
          <Link
            to="/ajouter-client"
            className="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full shadow hover:bg-green-600"
          >
            <FaPlusCircle className="text-lg" />
          </Link>
        </div>

        {/* Barre de recherche */}
        <div className="flex items-center bg-white/20 border border-white/30 rounded-lg shadow p-3 mb-4 mx-auto max-w-lg backdrop-blur-sm">
          <FaSearch className="text-white mr-3" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-white placeholder-gray-200"
          />
        </div>

        {loading ? (
          <p className="text-center mt-10">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white text-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-2 flex flex-col justify-between transform scale-90"
              >
                {/* Infos principales */}
                <div>
                  <div className="flex items-center mb-1">
                    <FaUser className="text-blue-600 mr-2" />
                    <span className="font-bold text-sm truncate">{client.nom}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-xs mb-1">
                    <FaPhone className="mr-2" />
                    {client.telephone}
                  </div>
                  <div className="flex items-center text-gray-600 text-xs mb-1">
                    <FaEnvelope className="mr-2" />
                    {client.email || "—"}
                  </div>
                  <div className="flex items-center text-gray-600 text-xs mb-2">
                    <FaMapMarkerAlt className="mr-2" />
                    {client.adresse || "—"}
                  </div>
                </div>

                {/* Infos commandes */}
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex items-center">
                    <FaShoppingCart className="mr-2 text-gray-500" />
                    Commandes :
                    <span className="font-semibold ml-1">{client.commandes}</span>
                  </div>
                  <div className="flex items-center">
                    <FaShoppingCart className="mr-2 text-orange-500" />
                    En cours :
                    <span className="font-semibold ml-1">{client.commandesEnCours}</span>
                  </div>
                  <div className="flex items-center">
                    <FaDollarSign className="mr-2 text-gray-500" />
                    Total payé :
                    <span className="font-semibold ml-1">{client.total}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-gray-500" />
                    Dernière :
                    <span className="font-semibold ml-1">{client.derniere}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-2 flex justify-end">
                  <Link
                    to={`/modifier-client/${client.id}`}
                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded shadow text-xs"
                  >
                    <FaEdit className="mr-1" /> Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;

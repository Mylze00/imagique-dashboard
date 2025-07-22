import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    const snapshot = await getDocs(collection(db, "clients"));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClients(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Liste des clients</h2>
        <Link
          to="/ajouter-client"
          className="px-4 py-2 bg-green-600 text-white rounded font-semibold"
        >
          ➕ Ajouter client
        </Link>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-left text-sm text-gray-600">
                <th className="p-3">Nom</th>
                <th className="p-3">Téléphone</th>
                <th className="p-3">Commandes</th>
                <th className="p-3">Total payé</th>
                <th className="p-3">Dernière commande</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr key={index} className="border-t text-sm hover:bg-gray-50">
                  <td className="p-3">{client.nom}</td>
                  <td className="p-3">{client.telephone}</td>
                  <td className="p-3">{client.commandes || "—"}</td>
                  <td className="p-3">{client.total || "—"}</td>
                  <td className="p-3">{client.derniere || "—"}</td>
                  <td className="p-3">
                    <Link
                      to={`/modifier-client/${client.id}`}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      ✏️ Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;

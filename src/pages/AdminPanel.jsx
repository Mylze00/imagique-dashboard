import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          role: (d.data().role || "client").trim().toLowerCase(),
          authorized: d.data().authorized ?? (d.data().role === "client"), // client autorisé par défaut
        }));
        setUsers(list);
      } catch (error) {
        alert("❌ Erreur lors du chargement des utilisateurs : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateDoc(doc(db, "users", id), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
      alert("✅ Rôle mis à jour");
    } catch (error) {
      alert("❌ Erreur mise à jour rôle : " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Supprimer cet utilisateur ?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("✅ Utilisateur supprimé");
    } catch (error) {
      alert("❌ Erreur suppression : " + error.message);
    }
  };

  const handleAuthorize = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), { authorized: true });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, authorized: true } : u))
      );
      alert("✅ Utilisateur autorisé");
    } catch (error) {
      alert("❌ Erreur autorisation : " + error.message);
    }
  };

  if (role !== "admin") {
    return (
      <div className="text-center text-red-600 font-bold text-xl mt-20">
        ❌ Accès refusé (Administrateurs uniquement)
      </div>
    );
  }

  // Comptage par rôle
  const adminCount = users.filter((u) => u.role === "admin").length;
  const agentCount = users.filter((u) => u.role === "agent").length;
  const clientCount = users.filter((u) => u.role === "client").length;

  const chartData = [
    { name: "Administrateurs", value: adminCount },
    { name: "Agents", value: agentCount },
    { name: "Clients", value: clientCount },
  ];

  const COLORS = ["#2563eb", "#10b981", "#f59e0b"]; // Bleu = admin, Vert = agent, Jaune = client

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-4">👑 Panneau d'administration</h2>

          <div className="flex flex-wrap gap-6 mb-6">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded shadow font-semibold">
              Administrateurs : {adminCount}
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded shadow font-semibold">
              Agents : {agentCount}
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow font-semibold">
              Clients : {clientCount}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Répartition des utilisateurs
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Rôle</th>
                    <th className="p-3">Autorisation</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{u.nom || "—"}</td>
                      <td className="p-3">{u.email || "—"}</td>
                      <td className="p-3">{u.phone || "—"}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="border p-1 rounded"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="agent">Agent</option>
                          <option value="client">Client</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.authorized ? (
                          "✅ Autorisé"
                        ) : (
                          <button
                            onClick={() => handleAuthorize(u.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded"
                          >
                            Autoriser
                          </button>
                        )}
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

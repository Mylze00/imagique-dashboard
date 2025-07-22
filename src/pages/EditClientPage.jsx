import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const EditClientPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const docRef = doc(db, "clients", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setNom(data.nom || "");
          setTelephone(data.telephone || "");
        } else {
          alert("❌ Client introuvable.");
          navigate("/clients");
        }
      } catch (error) {
        alert("❌ Erreur lors de la récupération : " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "clients", id);
      await updateDoc(docRef, {
        nom,
        telephone,
      });
      alert("✅ Client mis à jour avec succès !");
      navigate("/clients");
    } catch (error) {
      alert("❌ Erreur lors de la mise à jour : " + error.message);
    }
  };

  if (loading) return <p className="p-6">Chargement...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-gray-800">✏️ Modifier client</h2>
      <form onSubmit={handleUpdate} className="space-y-4 max-w-md bg-white p-6 rounded shadow">
        <div>
          <label className="block font-semibold mb-1">Nom :</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="input w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Téléphone :</label>
          <input
            type="text"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="input w-full border p-2 rounded"
            required
          />
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            💾 Enregistrer
          </button>
          <button
            type="button"
            onClick={() => navigate("/clients")}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            ↩️ Retour
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClientPage;

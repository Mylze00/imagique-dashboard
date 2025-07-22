import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const AddClientPage = () => {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "clients"), {
        nom,
        telephone,
        email,
        adresse,
        createdAt: serverTimestamp(),
      });
      alert("✅ Client ajouté avec succès !");
      navigate("/clients");
    } catch (error) {
      alert("❌ Erreur lors de l’ajout : " + error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-gray-800">➕ Ajouter un client</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow max-w-md">
        <div>
          <label className="block mb-1 font-semibold">Nom complet :</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Téléphone :</label>
          <input
            type="text"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Email :</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Adresse de livraison :</label>
          <textarea
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
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

export default AddClientPage;

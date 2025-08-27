import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const ModifierProduitPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduit = async () => {
      try {
        const docRef = doc(db, "produitsEvalués", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProduit({ id: snapshot.id, ...snapshot.data() });
        } else {
          alert("Produit introuvable");
          navigate("/produits-evalues");
        }
      } catch (error) {
        alert("Erreur chargement produit : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduit();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduit((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, "produitsEvalués", produit.id);
      await updateDoc(docRef, {
        nomProduit: produit.nomProduit,
        designation: produit.designation,
        prixAffiche: produit.prixAffiche,
        commission: produit.commission,
        quantite: produit.quantite,
        poidsKg: produit.poidsKg,
      });
      alert("✅ Produit mis à jour");
      navigate("/produits-evalues");
    } catch (error) {
      alert("❌ Erreur mise à jour : " + error.message);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!produit) return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-4">✏️ Modifier Produit</h2>
          <div className="bg-white p-4 rounded shadow max-w-lg">
            <label className="block mb-2">Nom du produit :</label>
            <input
              type="text"
              name="nomProduit"
              value={produit.nomProduit}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <label className="block mb-2">Désignation :</label>
            <input
              type="text"
              name="designation"
              value={produit.designation}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <label className="block mb-2">Prix affiché :</label>
            <input
              type="number"
              name="prixAffiche"
              value={produit.prixAffiche}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <label className="block mb-2">Commission (%) :</label>
            <input
              type="number"
              name="commission"
              value={produit.commission}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <label className="block mb-2">Quantité :</label>
            <input
              type="number"
              name="quantite"
              value={produit.quantite}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <label className="block mb-2">Poids (kg) :</label>
            <input
              type="number"
              name="poidsKg"
              value={produit.poidsKg}
              onChange={handleChange}
              className="border p-2 w-full mb-3 rounded"
            />
            <button
              onClick={handleSave}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              💾 Sauvegarder
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModifierProduitPage;

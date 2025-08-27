import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

const steps = ["Payé", "En cours", "Prêt à être livré", "Livré"];

const EditOrderPage = () => {
  const { orderId } = useParams(); // ID commande
  const navigate = useNavigate();

  const [client, setClient] = useState("");
  const [etat, setEtat] = useState("Payé");
  const [total, setTotal] = useState(0);
  const [produits, setProduits] = useState([]);
  const [imagePreview, setImagePreview] = useState({});
  const [loading, setLoading] = useState(true);

  // Charger la commande existante
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const ref = doc(db, "commandes", orderId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setClient(data.client);
          setEtat(data.etat || "Payé");
          setTotal(data.total);
          setProduits(
            Array.isArray(data.produits)
              ? data.produits.map((prod) => ({
                  designation: prod.designation || "",
                  prix: prod.prix || 0,
                  quantite: prod.quantite || 1,
                  images: prod.images || [],
                  total: prod.total || (prod.prix || 0) * (prod.quantite || 1),
                }))
              : []
          );
        } else {
          alert("Commande introuvable !");
          navigate("/commandes");
        }
      } catch (error) {
        alert("❌ Erreur récupération : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  // Calcul du total d’un produit
  const updateProduitTotal = (index, field, value) => {
    const updated = [...produits];
    updated[index][field] = value;
    updated[index].total = updated[index].prix * updated[index].quantite;
    setProduits(updated);

    const totalGlobal = updated.reduce((sum, p) => sum + (p.total || 0), 0);
    setTotal(totalGlobal);
  };

  // Ajouter un produit
  const handleAddProduit = () => {
    setProduits([
      ...produits,
      { designation: "", prix: 0, quantite: 1, images: [], total: 0 },
    ]);
  };

  // Supprimer un produit
  const handleRemoveProduit = (index) => {
    const updated = produits.filter((_, i) => i !== index);
    setProduits(updated);
    const totalGlobal = updated.reduce((sum, p) => sum + (p.total || 0), 0);
    setTotal(totalGlobal);
  };

  // Gérer images multiples (converties en base64)
  const handleImageChange = (index, files) => {
    const promises = Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((base64Images) => {
      const updated = [...produits];
      updated[index].images = base64Images;
      setProduits(updated);
      setImagePreview((prev) => ({ ...prev, [index]: base64Images }));
    });
  };

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "commandes", orderId), {
        client,
        etat,
        total: parseFloat(total),
        produits,
      });
      alert("✅ Commande mise à jour");
      navigate(`/commandes/${orderId}`);
    } catch (error) {
      alert("❌ Erreur mise à jour : " + error.message);
    }
  };

  if (loading) return <p className="p-6">Chargement...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Boutons retour */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => navigate(`/commandes/${orderId}`)}
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← Retour Détails
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        >
          ⬅ Accueil
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">✏️ Modifier une commande</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
        {/* Client */}
        <input
          type="text"
          placeholder="Nom du client"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />

        {/* État de la commande */}
        <select
          value={etat}
          onChange={(e) => setEtat(e.target.value)}
          className="border p-2 w-full rounded"
        >
          {steps.map((step, i) => (
            <option key={i} value={step}>
              {step}
            </option>
          ))}
        </select>

        {/* Produits */}
        <h3 className="font-semibold">Produits</h3>
        {produits.map((prod, index) => (
          <div key={index} className="border p-3 rounded mb-3 bg-gray-50">
            <input
              type="text"
              placeholder="Désignation"
              value={prod.designation}
              onChange={(e) => updateProduitTotal(index, "designation", e.target.value)}
              className="border p-2 w-full rounded mb-2"
              required
            />
            <input
              type="number"
              placeholder="Prix unitaire"
              value={prod.prix}
              onChange={(e) =>
                updateProduitTotal(index, "prix", parseFloat(e.target.value))
              }
              className="border p-2 w-full rounded mb-2"
              required
            />
            <input
              type="number"
              placeholder="Quantité"
              value={prod.quantite}
              onChange={(e) =>
                updateProduitTotal(index, "quantite", parseInt(e.target.value))
              }
              className="border p-2 w-full rounded mb-2"
              required
            />

            {/* Upload images */}
            <input
              type="file"
              multiple
              onChange={(e) => handleImageChange(index, e.target.files)}
              className="mb-2"
            />
            <div className="flex gap-2 flex-wrap">
              {(imagePreview[index] || prod.images || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="Produit"
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>

            <p className="font-bold mt-2">Total : {prod.total?.toFixed(2)} $</p>

            <button
              type="button"
              onClick={() => handleRemoveProduit(index)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🗑️ Supprimer produit
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddProduit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ➕ Ajouter un produit
        </button>

        {/* Total global */}
        <div className="mt-4">
          <p className="font-bold text-lg">Total global : {total.toFixed(2)} $</p>
        </div>

        {/* Bouton submit */}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded w-full mt-4 hover:bg-green-700"
        >
          💾 Enregistrer les modifications
        </button>
      </form>
    </div>
  );
};

export default EditOrderPage;

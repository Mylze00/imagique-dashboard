import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const AddOrderPage = () => {
  const navigate = useNavigate();

  const [client, setClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [produits, setProduits] = useState([
    { code: "", designation: "", lien: "", image: "", prix: "", quantite: "", total: 0 }
  ]);
  const [filePreviews, setFilePreviews] = useState({});
  const [totalGlobal, setTotalGlobal] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, "clients"));
      const list = snapshot.docs.map(doc => doc.data().nom);
      setClientsList(list);
    };
    fetchClients();
  }, []);

  const handleProduitChange = (index, field, value) => {
    const updated = [...produits];
    updated[index][field] = value;

    if (field === "prix" || field === "quantite") {
      const prix = parseFloat(updated[index].prix) || 0;
      const quantite = parseInt(updated[index].quantite) || 0;
      updated[index].total = prix * quantite;
    }

    setProduits(updated);
    const total = updated.reduce((acc, p) => acc + (p.total || 0), 0);
    setTotalGlobal(total);
  };

  const handleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...produits];
      updated[index].image = reader.result;
      setProduits(updated);
      setFilePreviews(prev => ({ ...prev, [index]: reader.result }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const addProduit = () => {
    setProduits([...produits, { code: "", designation: "", lien: "", image: "", prix: "", quantite: "", total: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "commandes"), {
        client,
        produits,
        total: totalGlobal,
        createdAt: serverTimestamp()
      });
      alert("✅ Commande enregistrée avec succès !");
      navigate("/"); // Retour auto après enregistrement
    } catch (error) {
      alert("❌ Erreur: " + error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
      >
        ⬅ Retour au Dashboard
      </button>

      <h2 className="text-2xl font-bold mb-4">📝 Ajouter une commande</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="font-semibold">Client :</label>
          <select
            className="block w-full p-2 mt-1 border rounded"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            required
          >
            <option value="">-- Sélectionner un client --</option>
            {clientsList.map((nom, i) => (
              <option key={i} value={nom}>{nom}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {produits.map((prod, index) => (
            <div key={index} className="bg-white p-4 border rounded shadow">
              <h4 className="font-bold text-gray-700 mb-2">Produit #{index + 1}</h4>
              <input className="input w-full mb-2" type="text" placeholder="N° de produit" value={prod.code} onChange={e => handleProduitChange(index, "code", e.target.value)} required />
              <input className="input w-full mb-2" type="text" placeholder="Désignation" value={prod.designation} onChange={e => handleProduitChange(index, "designation", e.target.value)} required />
              <input className="input w-full mb-2" type="text" placeholder="Lien du produit (https://...)" value={prod.lien} onChange={e => handleProduitChange(index, "lien", e.target.value)} required />
              <input type="file" accept="image/*" className="block mb-2" onChange={(e) => handleImageUpload(index, e.target.files[0])} />

              {(filePreviews[index] || prod.image) && (
                <img src={filePreviews[index] || prod.image} alt="Aperçu" className="h-32 object-cover border rounded mb-2" />
              )}

              <div className="grid grid-cols-2 gap-2">
                <input className="input w-full" type="number" placeholder="Prix unitaire" value={prod.prix} onChange={e => handleProduitChange(index, "prix", e.target.value)} required />
                <input className="input w-full" type="number" placeholder="Quantité" value={prod.quantite} onChange={e => handleProduitChange(index, "quantite", e.target.value)} required />
              </div>
              <p className="mt-2">💵 Total : <strong>{prod.total.toFixed(2)} $</strong></p>
            </div>
          ))}
          <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={addProduit}>
            ➕ Ajouter un produit
          </button>
        </div>

        <div className="font-bold text-lg mt-4">Total général : {totalGlobal.toFixed(2)} $</div>

        <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded">
          ✅ Enregistrer la commande
        </button>
      </form>
    </div>
  );
};

export default AddOrderPage;

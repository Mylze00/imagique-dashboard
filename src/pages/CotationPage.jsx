import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const PRIX_KG_AIR = 29;
const PRIX_M3_MARITIME = 600;

const CotationPageAgents = () => {
  const { role } = useAuth();
  const [client, setClient] = useState("");
  const [clientsList, setClientsList] = useState([]);
  const [modeExpedition, setModeExpedition] = useState("Air");
  const [produits, setProduits] = useState([
    {
      nomProduit: "",
      designation: "",
      lienProduit: "",
      imageProduit: "",
      prixAffiche: "",
      commission: 25,
      poidsKg: "",
      quantite: "",
      imageFile: null,
    },
  ]);
  const [loading, setLoading] = useState(false);

  // 🔹 Charger la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const snapshot = await getDocs(collection(db, "clients"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientsList(data);
      } catch (error) {
        console.error("Erreur chargement clients:", error);
      }
    };
    fetchClients();
  }, []);

  // 🔹 Ajouter un produit
  const handleAddProduit = () => {
    setProduits([
      ...produits,
      {
        nomProduit: "",
        designation: "",
        lienProduit: "",
        imageProduit: "",
        prixAffiche: "",
        commission: 25,
        poidsKg: "",
        quantite: "",
        imageFile: null,
      },
    ]);
  };

  // 🔹 Supprimer un produit
  const handleRemoveProduit = (index) => {
    const list = [...produits];
    list.splice(index, 1);
    setProduits(list);
  };

  // 🔹 Gérer les changements dans les champs
  const handleChange = (index, field, value) => {
    const updated = [...produits];
    updated[index][field] = value;
    setProduits(updated);
  };

  // 🔹 Gestion upload image
  const handleImageChange = (index, file) => {
    const updated = [...produits];
    updated[index].imageFile = file;
    setProduits(updated);
  };

  // 🔹 Calcul du total global
  const calculTotalGlobal = () => {
    return produits.reduce((total, p) => {
      const prix = parseFloat(p.prixAffiche) || 0;
      const quantite = parseInt(p.quantite) || 0;
      return total + prix * quantite;
    }, 0);
  };

  // 🔹 Sauvegarde cotation
  const handleSaveCotation = async () => {
    try {
      setLoading(true);

      // Upload images produits
      const uploadedProduits = await Promise.all(
        produits.map(async (p) => {
          let imageUrl = "";
          if (p.imageFile) {
            const storageRef = ref(storage, `produits/${Date.now()}-${p.imageFile.name}`);
            await uploadBytesResumable(storageRef, p.imageFile);
            imageUrl = await getDownloadURL(storageRef);
          }
          return { ...p, imageProduit: imageUrl };
        })
      );

      await addDoc(collection(db, "cotations"), {
        client,
        modeExpedition,
        produits: uploadedProduits,
        totalGlobal: calculTotalGlobal(),
        createdAt: serverTimestamp(),
      });

      alert("Cotation enregistrée ✅");
      setProduits([
        {
          nomProduit: "",
          designation: "",
          lienProduit: "",
          imageProduit: "",
          prixAffiche: "",
          commission: 25,
          poidsKg: "",
          quantite: "",
          imageFile: null,
        },
      ]);
      setClient("");
    } catch (error) {
      console.error("Erreur ajout cotation:", error);
      alert("Erreur lors de l'enregistrement ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Créer une cotation</h1>

          {/* Sélection client */}
          <label className="block mb-2 font-semibold">Client</label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          >
            <option value="">-- Sélectionner un client --</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.nom}>{c.nom}</option>
            ))}
          </select>

          {/* Mode expédition */}
          <label className="block mb-2 font-semibold">Mode d'expédition</label>
          <select
            value={modeExpedition}
            onChange={(e) => setModeExpedition(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          >
            <option value="Air">Air</option>
            <option value="Maritime">Maritime</option>
          </select>

          {/* Produits */}
          {produits.map((produit, index) => (
            <div key={index} className="border p-4 rounded mb-4">
              <h2 className="font-semibold mb-2">Produit {index + 1}</h2>
              <input
                type="text"
                placeholder="Nom du produit"
                value={produit.nomProduit}
                onChange={(e) => handleChange(index, "nomProduit", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Désignation"
                value={produit.designation}
                onChange={(e) => handleChange(index, "designation", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Lien du produit"
                value={produit.lienProduit}
                onChange={(e) => handleChange(index, "lienProduit", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="number"
                placeholder="Prix affiché"
                value={produit.prixAffiche}
                onChange={(e) => handleChange(index, "prixAffiche", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="number"
                placeholder="Quantité"
                value={produit.quantite}
                onChange={(e) => handleChange(index, "quantite", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="number"
                placeholder="Poids (kg)"
                value={produit.poidsKg}
                onChange={(e) => handleChange(index, "poidsKg", e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              {/* Upload image */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(index, e.target.files[0])}
                className="mb-2"
              />
              {produit.imageFile && (
                <img
                  src={URL.createObjectURL(produit.imageFile)}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded mb-2"
                />
              )}

              <button
                onClick={() => handleRemoveProduit(index)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Supprimer
              </button>
            </div>
          ))}

          <button
            onClick={handleAddProduit}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          >
            ➕ Ajouter un produit
          </button>

          {/* Total */}
          <div className="mb-4">
            <strong>Total global:</strong> {calculTotalGlobal()} $
          </div>

          {/* Enregistrer */}
          <button
            onClick={handleSaveCotation}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            {loading ? "Enregistrement..." : "✅ Enregistrer la cotation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CotationPageAgents;

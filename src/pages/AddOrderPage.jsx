import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AddOrderPage = () => {
  const [commandes, setCommandes] = useState([
    {
      client: "",
      produits: [
        { designation: "", lien: "", images: [], prix: "", quantite: "", total: 0 },
      ],
      total: 0,
    },
  ]);
  const [clientsList, setClientsList] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const snapshot = await getDocs(collection(db, "clients"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, nom: doc.data().nom }));
      setClientsList(list);
    };
    fetchClients();
  }, []);

  const handleProduitChange = (cmdIndex, prodIndex, field, value) => {
    const updated = [...commandes];
    updated[cmdIndex].produits[prodIndex][field] = value;

    if (field === "prix" || field === "quantite") {
      const prix = parseFloat(updated[cmdIndex].produits[prodIndex].prix) || 0;
      const quantite = parseInt(updated[cmdIndex].produits[prodIndex].quantite) || 0;
      updated[cmdIndex].produits[prodIndex].total = prix * quantite;
    }

    updated[cmdIndex].total = updated[cmdIndex].produits.reduce(
      (sum, p) => sum + (p.total || 0),
      0
    );
    setCommandes(updated);
  };

  const uploadImageToFirebase = (file, cmdIndex, prodIndex) => {
    return new Promise((resolve, reject) => {
      // ⭐️ CHEMIN MODIFIÉ pour correspondre aux règles de Firebase Storage
      const storageRef = ref(storage, `public/produits/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress((prev) => ({
            ...prev,
            [`${cmdIndex}-${prodIndex}-${file.name}`]: progress,
          }));
        },
        reject,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleMultipleImages = async (cmdIndex, prodIndex, files) => {
    if (files.length === 0) return;
    setIsUploading(true);

    const newFiles = Array.from(files);
    const previews = newFiles.map((file) => URL.createObjectURL(file));

    setFilePreviews((prev) => ({
      ...prev,
      [`${cmdIndex}-${prodIndex}`]: [
        ...(prev[`${cmdIndex}-${prodIndex}`] || []),
        ...previews,
      ],
    }));

    try {
      const uploadPromises = newFiles.map((file) =>
        uploadImageToFirebase(file, cmdIndex, prodIndex)
      );

      const downloadURLs = await Promise.all(uploadPromises);

      setCommandes((prev) => {
        const updated = [...prev];
        const currentImages = updated[cmdIndex].produits[prodIndex].images || [];
        updated[cmdIndex].produits[prodIndex].images = [
          ...currentImages,
          ...downloadURLs,
        ];
        return updated;
      });
    } catch (error) {
      console.error("Erreur lors de l'upload des images:", error);
      alert("❌ Erreur lors de l'upload des images");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const removeImage = (cmdIndex, prodIndex, imgIdx) => {
    setCommandes((prev) => {
      const updated = [...prev];
      updated[cmdIndex].produits[prodIndex].images.splice(imgIdx, 1);
      return updated;
    });

    setFilePreviews((prev) => {
      const updated = { ...prev };
      updated[`${cmdIndex}-${prodIndex}`].splice(imgIdx, 1);
      return updated;
    });
  };

  const addProduit = (cmdIndex) => {
    const updated = [...commandes];
    updated[cmdIndex].produits.push({
      designation: "",
      lien: "",
      images: [],
      prix: "",
      quantite: "",
      total: 0,
    });
    setCommandes(updated);
  };

  const addCommande = () => {
    setCommandes([
      ...commandes,
      {
        client: "",
        produits: [
          { designation: "", lien: "", images: [], prix: "", quantite: "", total: 0 },
        ],
        total: 0,
      },
    ]);
  };

  const generateOrderNumber = async () => {
    const counterRef = doc(db, "config", "ordersCounter");
    const counterSnap = await getDoc(counterRef);

    if (!counterSnap.exists()) await setDoc(counterRef, { lastNumber: 0 });

    const lastNumber = counterSnap.exists() ? counterSnap.data().lastNumber : 0;
    const newNumber = lastNumber + 1;

    await updateDoc(counterRef, { lastNumber: newNumber });
    return `ALKN${String(newNumber).padStart(3, "0")}`;
  };

  const ajouterOuMettreAJourProduitEvalue = async (prod) => {
    const q = query(
      collection(db, "produitsEvalués"),
      where("designation", "==", prod.designation)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      const currentData = snapshot.docs[0].data();
      await updateDoc(docRef, {
        quantite: (currentData.quantite || 0) + (parseInt(prod.quantite) || 0),
        prixFinal: parseFloat(prod.prix) || 0,
      });
    } else {
      await addDoc(collection(db, "produitsEvalués"), {
        designation: prod.designation,
        lien: prod.lien,
        images: prod.images,
        prixFinal: parseFloat(prod.prix) || 0,
        quantite: parseInt(prod.quantite) || 0,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Vous devez être connecté");

    try {
      for (const cmd of commandes) {
        const numeroCommande = await generateOrderNumber();
        await addDoc(collection(db, "commandes"), {
          client: cmd.client,
          produits: cmd.produits,
          total: cmd.total,
          etat: "Payé",
          numeroCommande,
          createdAt: serverTimestamp(),
          userId: auth.currentUser.uid,
        });

        for (const prod of cmd.produits) {
          await ajouterOuMettreAJourProduitEvalue(prod);
        }
      }
      alert("✅ Commandes enregistrées !");
      setCommandes([
        {
          client: "",
          produits: [
            { designation: "", lien: "", images: [], prix: "", quantite: "", total: 0 },
          ],
          total: 0,
        },
      ]);
      setFilePreviews({});
      setUploadProgress({});
    } catch (error) {
      alert("❌ Erreur: " + error.message);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-4">📝 Ajouter plusieurs commandes</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {commandes.map((cmd, cmdIndex) => (
              <div
                key={cmdIndex}
                className="bg-white p-4 border rounded shadow space-y-4"
              >
                <label className="font-semibold">Client :</label>
                <select
                  className="block w-full p-2 mt-1 border rounded mb-4"
                  value={cmd.client}
                  onChange={(e) => {
                    const updated = [...commandes];
                    updated[cmdIndex].client = e.target.value;
                    setCommandes(updated);
                  }}
                  required
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.nom}>
                      {c.nom}
                    </option>
                  ))}
                </select>

                {cmd.produits.map((prod, prodIndex) => (
                  <div
                    key={prodIndex}
                    className="bg-gray-50 p-4 border rounded mb-3 space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Désignation"
                      value={prod.designation}
                      onChange={(e) =>
                        handleProduitChange(cmdIndex, prodIndex, "designation", e.target.value)
                      }
                      className="input w-full mb-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Lien du produit"
                      value={prod.lien}
                      onChange={(e) =>
                        handleProduitChange(cmdIndex, prodIndex, "lien", e.target.value)
                      }
                      className="input w-full mb-2"
                    />

                    <div
                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded mb-2 cursor-pointer"
                      onClick={() =>
                        document.getElementById(`fileInput-${cmdIndex}-${prodIndex}`).click()
                      }
                    >
                      <p className="text-gray-500">📂 Glisser ou cliquer pour images</p>
                      <input
                        id={`fileInput-${cmdIndex}-${prodIndex}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          handleMultipleImages(cmdIndex, prodIndex, e.target.files)
                        }
                      />
                    </div>

                    {filePreviews[`${cmdIndex}-${prodIndex}`]?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {filePreviews[`${cmdIndex}-${prodIndex}`].map((img, imgIdx) => (
                          <div key={imgIdx} className="relative">
                            <img
                              src={img}
                              alt=""
                              className="h-24 w-full object-cover border rounded"
                            />
                            {uploadProgress[`${cmdIndex}-${prodIndex}-${imgIdx}`] && (
                              <div className="absolute bottom-0 left-0 w-full bg-gray-300">
                                <div
                                  className="bg-green-500 text-xs text-white text-center"
                                  style={{
                                    width: `${uploadProgress[`${cmdIndex}-${prodIndex}-${imgIdx}`]}%`,
                                  }}
                                >
                                  {uploadProgress[`${cmdIndex}-${prodIndex}-${imgIdx}`]}%
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                              onClick={() =>
                                removeImage(cmdIndex, prodIndex, imgIdx)
                              }
                            >
                              ✖
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Prix unitaire"
                        value={prod.prix}
                        onChange={(e) =>
                          handleProduitChange(cmdIndex, prodIndex, "prix", e.target.value)
                        }
                        className="input w-full"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Quantité"
                        value={prod.quantite}
                        onChange={(e) =>
                          handleProduitChange(cmdIndex, prodIndex, "quantite", e.target.value)
                        }
                        className="input w-full"
                        required
                      />
                    </div>
                    <p className="mt-2 font-bold">
                      💵 Total : {(prod.total || 0).toFixed(2)} $
                    </p>
                  </div>
                ))}

                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => addProduit(cmdIndex)}
                >
                  ➕ Ajouter un produit
                </button>
                <p className="mt-4 font-bold">
                  Total commande : {cmd.total.toFixed(2)} $
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={addCommande}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              ➕ Ajouter une commande
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white font-bold rounded"
              disabled={isUploading}
            >
              {isUploading ? "Chargement..." : "✅ Enregistrer toutes les commandes"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddOrderPage;
import React, { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const CotationsList = () => {
  const [cotations, setCotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "cotations"),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setCotations(list);
        setLoading(false);
      },
      (error) => {
        alert("❌ Erreur chargement cotations : " + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const transformerEnCommande = async (cotation) => {
    try {
      await addDoc(collection(db, "commandes"), {
        client: cotation.client,
        produits: cotation.produits,
        total: cotation.totalGlobal,
        modeExpedition: cotation.modeExpedition,
        etat: "En attente",
        createdAt: new Date(),
      });

      for (const prod of cotation.produits) {
        await addDoc(collection(db, "produitsEvalués"), {
          nomProduit: prod.nomProduit,
          imageProduit: prod.imageProduit,
          prixFinal: prod.total,
          quantite: prod.quantite,
          createdAt: new Date(),
        });
      }

      await deleteDoc(doc(db, "cotations", cotation.id));
      alert("✅ Cotation transformée en commande !");
    } catch (error) {
      alert("❌ Erreur lors de la transformation : " + error.message);
    }
  };

  const supprimerCotation = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette cotation ?")) {
      try {
        await deleteDoc(doc(db, "cotations", id));
        alert("🗑️ Cotation supprimée avec succès.");
      } catch (error) {
        alert("❌ Erreur suppression : " + error.message);
      }
    }
  };
  
  const modifierCotation = (id) => {
    navigate(`/cotation/${id}`);
  };

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 5000);
        img.src = url;
      } catch {
        resolve(null);
      }
    });
  };

  const telechargerPDF = async (cotation) => {
    const docPDF = new jsPDF();
    const pageWidth = docPDF.internal.pageSize.getWidth();

    try {
      const headerBase64 = await loadImageAsBase64(`${window.location.origin}/entete.png`);
      if (headerBase64) {
        docPDF.addImage(headerBase64, "PNG", 10, 5, pageWidth - 20, 20);
      }

      let yPos = 30;
      docPDF.setFontSize(20);
      docPDF.text("Devis de Cotation", pageWidth / 2, yPos, { align: "center" });

      yPos += 12;
      docPDF.setFontSize(12);
      docPDF.text(`Client : ${cotation.client}`, 10, yPos);
      docPDF.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 60, yPos);
      yPos += 8;
      docPDF.text(`Mode d'expédition : ${cotation.modeExpedition}`, 10, yPos);

      const imagesBase64 = await Promise.all(
        cotation.produits.map((prod) => loadImageAsBase64(prod.imageProduit))
      );

      const tableData = cotation.produits.map((prod, index) => [
        index + 1,
        prod.nomProduit.length > 40 ? prod.nomProduit.slice(0, 40) + "..." : prod.nomProduit,
        prod.quantite,
        prod.quantite > 0 ? (prod.total / prod.quantite).toFixed(2) + " $" : "0.00 $",
        prod.total.toFixed(2) + " $",
      ]);

      docPDF.autoTable({
        startY: yPos + 10,
        head: [["#", "Produit", "Quantité", "Prix Unitaire", "Total"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { minCellHeight: 12, fontSize: 11 },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
        },
      });

      const finalY = docPDF.lastAutoTable.finalY || yPos + 20;
      const rowHeight = 12;

      cotation.produits.forEach((prod, idx) => {
        const img = imagesBase64[idx];
        if (img) {
          const yImage = docPDF.lastAutoTable.startY + 15 + idx * rowHeight;
          if (yImage + 10 < docPDF.internal.pageSize.getHeight() - 20) {
            try {
              docPDF.addImage(img, "PNG", 12, yImage, 10, 10);
            } catch (e) {
              console.warn("Erreur ajout image :", e);
            }
          }
        }
      });

      docPDF.setFontSize(14);
      docPDF.text(
        `Total Général : ${cotation.totalGlobal?.toFixed(2)} $`,
        pageWidth - 80,
        finalY + 10
      );

      docPDF.setFontSize(10);
      docPDF.text(
        "Merci pour votre confiance. Contactez-nous pour plus d'infos.",
        pageWidth / 2,
        docPDF.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );

      docPDF.save(`Cotation_${cotation.client}_${cotation.id}.pdf`);
    } catch (error) {
      alert("❌ Erreur génération PDF : " + error.message);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="p-6">
          {loading ? (
            <p>Chargement...</p>
          ) : cotations.length === 0 ? (
            <p className="text-center text-gray-600">Aucune cotation enregistrée.</p>
          ) : (
            <div className="space-y-6">
              {cotations.map((cotation) => (
                <div
                  key={cotation.id}
                  className="bg-white shadow rounded p-6 border border-gray-200"
                >
                  <h2 className="text-2xl font-bold text-gray-700 underline mb-2">
                    LISTE DE COTATION
                  </h2>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    Client : {cotation.client}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Mode d’expédition : <span className="font-semibold">{cotation.modeExpedition}</span>
                  </p>

                  <h4 className="text-md font-semibold text-gray-500 underline mb-2">
                    Produits ({cotation.produits?.length || 0})
                  </h4>
                  <ul className="list-disc pl-5 mb-4">
                    {cotation.produits?.map((prod, index) => (
                      <li key={index} className="text-gray-600 mb-1">
                        {prod.nomProduit} - 
                        <span className="text-green-600 font-bold"> {prod.total?.toFixed(2)} $</span> × {prod.quantite}
                      </li>
                    ))}
                  </ul>

                  <p className="text-lg font-bold text-gray-800">
                    Total Général : <span className="text-blue-600">{cotation.totalGlobal?.toFixed(2)} $</span>
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => transformerEnCommande(cotation)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      🔄 Transformer en commande
                    </button>
                    <button
                      onClick={() => telechargerPDF(cotation)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      📄 Télécharger PDF
                    </button>
                    <button
                      onClick={() => modifierCotation(cotation.id)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      ✏️ Modifier cotation
                    </button>
                    <button
                      onClick={() => supprimerCotation(cotation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CotationsList;
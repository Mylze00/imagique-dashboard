import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const DevisPDF = ({ cotation, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(true);

  const headerImage =
    "https://firebasestorage.googleapis.com/v0/b/imagique-holding.firebasestorage.app/o/public%2Fheader%2Fheader.png?alt=media&token=aa84e77d-52fe-46c3-a1f6-d23f7eb8d7b4";

  useEffect(() => {
    if (cotation) {
      generatePDF();
    }
  }, [cotation]);

  const generatePDF = async () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      setProgress(10);
      const img = await loadImage(headerImage);
      doc.addImage(img, "PNG", 40, 30, 520, 80);

      setProgress(20);
      doc.setFontSize(14);
      doc.text(`Client: ${cotation.clientInfo?.nom || "Inconnu"}`, 40, 130);
      doc.text(`Mode d’expédition: ${cotation.modeExpedition}`, 40, 150);
      doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 400, 130);

      setProgress(30);
      const tableRows = [];

      for (let i = 0; i < cotation.produits.length; i++) {
        const p = cotation.produits[i];
        const row = [
          p.nomProduit,
          p.designation,
          `${p.quantite}`,
          `${p.prixAffiche.toFixed(2)}$`,
          `${p.commission}%`,
          `${(p.poidsKg || 0).toFixed(2)} kg`,
          `${(p.total || 0).toFixed(2)}$`,
        ];
        tableRows.push(row);

        setProgress(30 + ((i + 1) * 30) / cotation.produits.length);
      }

      doc.autoTable({
        startY: 170,
        head: [["Nom", "Désignation", "Qté", "Prix", "Commission", "Poids", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [22, 160, 133] },
        margin: { left: 40, right: 40 },
      });

      setProgress(90);
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `TOTAL GÉNÉRAL : ${cotation.totalGlobal.toFixed(2)} $`,
        400,
        doc.lastAutoTable.finalY + 40
      );

      const mode = cotation.modeExpedition;
      const estimatedDelay =
        mode === "Air" ? "8 à 12 jours ouvrables" : "60 jours estimés (maritime)";
      doc.text(`Livraison estimée : ${estimatedDelay}`, 40, doc.lastAutoTable.finalY + 40);

      setProgress(100);
      doc.save(`Devis_${cotation.clientInfo?.nom || "Client"}.pdf`);

      setTimeout(() => {
        setGenerating(false);
        onFinish();
      }, 1000);
    } catch (err) {
      console.error("Erreur génération PDF :", err);
      onFinish();
    }
  };

  const loadImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });

  if (!generating) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          Génération du devis...
        </h2>
        <div className="w-full bg-gray-200 h-4 rounded">
          <div
            className="h-4 bg-green-500 rounded transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Veuillez patienter pendant la création du PDF...
        </p>
      </div>
    </div>
  );
};

export default DevisPDF;

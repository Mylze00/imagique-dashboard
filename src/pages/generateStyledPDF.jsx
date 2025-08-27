import jsPDF from "jspdf";
import "jspdf-autotable";

// Convertir une URL d'image en base64
const getBase64ImageFromUrl = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erreur chargement image :", err);
    return null;
  }
};

export const generateStyledPDF = async (order) => {
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFontSize(14);
  doc.text(`Facture: ${order.invoiceNumber}`, 14, 15);
  doc.setFontSize(12);
  doc.text(`Client: ${order.client}`, 14, 25);
  doc.text(`Date: ${order.createdAt}`, 14, 32);

  // Préparer les données de la table
  const bodyData = [];
  for (const prod of order.produits) {
    let imgBase64 = null;
    if (prod.image) {
      imgBase64 = await getBase64ImageFromUrl(prod.image);
    }
    bodyData.push([
      prod.name || "—",
      prod.quantity || 0,
      (prod.price || 0).toFixed(2) + " $",
      ((prod.quantity || 0) * (prod.price || 0)).toFixed(2) + " $",
      imgBase64, // On stocke la base64 dans la cellule
    ]);
  }

  doc.autoTable({
    startY: 40,
    head: [["Produit", "Qté", "Prix unitaire", "Prix total", "Image"]],
    body: bodyData,
    didDrawCell: (data) => {
      if (data.column.index === 4 && data.cell.raw) {
        try {
          doc.addImage(
            data.cell.raw,
            "JPEG",
            data.cell.x + 1,
            data.cell.y + 1,
            18, // largeur
            18  // hauteur
          );
        } catch (err) {
          console.error("Erreur ajout image dans PDF :", err);
        }
      }
    },
    columnStyles: {
      4: { cellWidth: 20 }, // colonne image fixe
    },
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  // Total général
  const totalGlobal = order.produits.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.price || 0),
    0
  );
  const finalY = doc.lastAutoTable.finalY || 60;
  doc.setFontSize(12);
  doc.text(`Total commande: ${totalGlobal.toFixed(2)} $`, 14, finalY + 10);

  doc.save(`Commande-${order.invoiceNumber}.pdf`);
};

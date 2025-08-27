import jsPDF from "jspdf";
import "jspdf-autotable";

const getBase64ImageFromUrl = async (url, maxWidth = 40, maxHeight = 40) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(blob);
    });

    const canvas = document.createElement("canvas");
    let { width, height } = img;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    width *= scale;
    height *= scale;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.8);
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

  let currentY = 42;

  // Précharger toutes les images
  const imagesBase64 = await Promise.all(
    (order.produits || []).map(async (p) => {
      if (p.image) return await getBase64ImageFromUrl(p.image, 40, 40);
      return null;
    })
  );

  for (let i = 0; i < (order.produits || []).length; i++) {
    const p = order.produits[i];
    const img = imagesBase64[i];

    // Encadré produit
    doc.setDrawColor(200);
    doc.rect(14, currentY, 182, 20, "S"); // x, y, width, height

    // Image à gauche
    if (img) doc.addImage(img, "JPEG", 16, currentY + 1, 18, 18);

    // Texte à droite de l’image
    const startX = 36;
    doc.setFontSize(11);
    doc.text(`${p.name || "—"}`, startX, currentY + 6);
    doc.text(`Qté: ${p.quantity || 0}`, startX, currentY + 11);
    doc.text(`Prix unitaire: ${(p.price || 0).toFixed(2)} $`, startX, currentY + 16);
    doc.text(`Prix total: ${((p.price || 0) * (p.quantity || 0)).toFixed(2)} $`, 120, currentY + 11);

    currentY += 25; // espace pour le prochain produit
    if (currentY > 250) { // nouvelle page si dépassement
      doc.addPage();
      currentY = 14;
    }
  }

  const totalGlobal = (order.produits || []).reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.price || 0),
    0
  );

  doc.setFontSize(12);
  doc.text(`Total commande: ${totalGlobal.toFixed(2)} $`, 14, currentY + 5);

  doc.save(`Commande-${order.invoiceNumber}.pdf`);
};

import jsPDF from "jspdf";
import "jspdf-autotable";
import imageCompression from "browser-image-compression";

// Constantes de calcul
const PRIX_KG_AIR = 29;        // Prix par kg (air)
const PRIX_M3_MARITIME = 80;   // Prix par m³ (maritime)

// Fonction de compression et conversion image en Base64
const getCompressedBase64Image = async (urlOrFile, maxWidth = 40, maxHeight = 40) => {
  try {
    let blob;

    if (typeof urlOrFile === "string") {
      // Cas: URL (Firebase ou autre)
      const res = await fetch(urlOrFile);
      blob = await res.blob();
    } else {
      // Cas: fichier uploadé (File)
      blob = urlOrFile;
    }

    // Compression
    const compressed = await imageCompression(blob, {
      maxSizeMB: 1,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
    });

    // Création image
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(compressed);
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
    console.error("Erreur chargement/compression image :", err);
    return null;
  }
};

export const generateStyledPDF = async (order) => {
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFontSize(14);
  doc.text(`Devis: ${order.id || "—"}`, 14, 15);
  doc.setFontSize(12);
  doc.text(`Client: ${order.client || "—"}`, 14, 25);
  doc.text(`Date: ${order.createdAt || "—"}`, 14, 32);

  let currentY = 42;

  // Précharger toutes les images
  const imagesBase64 = await Promise.all(
    (order.produits || []).map(async (p) => {
      if (p.imageProduit) return await getCompressedBase64Image(p.imageProduit, 40, 40);
      return null;
    })
  );

  // Calcul total
  let totalCommande = 0;

  for (let i = 0; i < (order.produits || []).length; i++) {
    const p = order.produits[i];
    const img = imagesBase64[i];

    // Calcul prix affiché (frais inclus)
    const transport = p.transport === "air"
      ? (p.poids || 0) * PRIX_KG_AIR
      : (p.volume || 0) * PRIX_M3_MARITIME;

    const prixAvecFrais = (p.prix || 0) + transport;
    const prixUnitaireComplet = prixAvecFrais * (1 + ((p.commission || 0) / 100));
    const prixTotal = prixUnitaireComplet * (p.quantite || 0);
    totalCommande += prixTotal;

    // Encadré produit
    doc.setDrawColor(200);
    doc.rect(14, currentY, 182, 25, "S"); // x, y, width, height

    // Image à gauche
    if (img) doc.addImage(img, "JPEG", 16, currentY + 3, 20, 20);

    // Texte produit
    const startX = 40;
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(p.nomProduit || "—", 100);
    doc.text(lines, startX, currentY + 6);

    doc.text(`Qté: ${p.quantite || 0}`, startX, currentY + 14);
    doc.text(`Prix unitaire (avec frais+comm): ${prixUnitaireComplet.toFixed(2)} $`, startX, currentY + 19);
    doc.text(`Total: ${prixTotal.toFixed(2)} $`, 140, currentY + 14);

    currentY += 30;
    if (currentY > 250) {
      doc.addPage();
      currentY = 14;
    }
  }

  doc.setFontSize(12);
  doc.text(`Total commande: ${totalCommande.toFixed(2)} $`, 14, currentY + 5);

  doc.save(`Devis-${order.id || "SansID"}.pdf`);
};

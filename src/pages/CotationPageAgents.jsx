import React, { useEffect } from 'react';
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import imageCompression from "browser-image-compression";

applyPlugin(jsPDF);

// Constantes de calcul (reprises du code CotationPageAdmin)
const PRIX_KG_AIR = 29;
const PRIX_M3_MARITIME = 600;

// Formater la devise
const formatCurrency = (amount) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount || 0);

// Calculer le volume en m³
const calculateVolumeM3 = (produit) =>
  (((parseFloat(produit.hauteur) || 0) * (parseFloat(produit.largeur) || 0) * (parseFloat(produit.longueur) || 0)) / 1_000_000);

// Calculer le prix total d'un produit avec tous les frais
const calculateProductTotal = (produit, modeExpedition) => {
  const prixAffiche = parseFloat(produit.prixAffiche) || 0;
  const commission = parseFloat(produit.commission) || 0;
  const poids = parseFloat(produit.poidsKg) || 0;
  const volumeM3 = calculateVolumeM3(produit);
  const quantite = parseFloat(produit.quantite) || 0;

  const prixTransport = modeExpedition === "Air" ? poids * PRIX_KG_AIR : volumeM3 * PRIX_M3_MARITIME;
  const prixAchatCommissionne = prixAffiche * (1 + commission / 100);

  return (prixAchatCommissionne + prixTransport) * quantite;
};

// Convertir image vers Base64 compressée
const imageToBase64 = async (imageSource) => {
  try {
    console.debug("🔄 Converting image → Base64:", imageSource);
    
    let blob;
    if (imageSource instanceof File) {
      blob = imageSource;
    } else if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:')) {
        return imageSource;
      }
      const response = await fetch(imageSource);
      if (!response.ok) return null;
      blob = await response.blob();
    } else {
      return null;
    }

    const compressedBlob = await imageCompression(blob, {
      maxWidthOrHeight: 400,
      maxSizeMB: 0.3,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.8,
    });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    console.error("❌ Image conversion error:", error);
    return null;
  }
};

// Convertir toutes les images des produits
const convertProductsImagesToBase64 = async (produits) => {
  return Promise.all(
    produits.map(async (produit, index) => {
      console.debug(`📦 Processing product #${index + 1}: ${produit.nomProduit}`);
      
      let imageBase64 = null;
      if (produit.imageFile) {
        imageBase64 = await imageToBase64(produit.imageFile);
      } else if (produit.imageProduit) {
        imageBase64 = await imageToBase64(produit.imageProduit);
      } else if (produit.previewUrl) {
        imageBase64 = await imageToBase64(produit.previewUrl);
      }

      return {
        ...produit,
        imageBase64
      };
    })
  );
};

// Générer le PDF de cotation
const generateCotationPDF = async (cotationData) => {
  console.debug("🚀 Generating PDF for cotation");

  const doc = new jsPDF("p", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // === 1️⃣ Header avec bandeau ===
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 100, "F");

  // Titre
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DEVIS / COTATION", pageWidth / 2, 50, { align: "center" });

  // === 2️⃣ Informations de la cotation ===
  const infoY = 120;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, infoY, pageWidth - 2 * margin, 120, "F");
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, infoY, pageWidth - 2 * margin, 120);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Informations client
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT:", margin + 20, infoY + 25);
  doc.setFont("helvetica", "normal");
  doc.text(cotationData.client || "Non spécifié", margin + 80, infoY + 25);

  // Mode d'expédition
  doc.setFont("helvetica", "bold");
  doc.text("EXPÉDITION:", margin + 20, infoY + 45);
  doc.setFont("helvetica", "normal");
  doc.text(cotationData.modeExpedition || "Air", margin + 110, infoY + 45);

  // Date
  doc.setFont("helvetica", "bold");
  doc.text("DATE:", margin + 20, infoY + 65);
  doc.setFont("helvetica", "normal");
  const dateStr = cotationData.timestamp ? 
    new Date(cotationData.timestamp.toDate()).toLocaleDateString('fr-FR') : 
    new Date().toLocaleDateString('fr-FR');
  doc.text(dateStr, margin + 70, infoY + 65);

  // Total global
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text("TOTAL GLOBAL:", pageWidth / 2 + 50, infoY + 45);
  doc.setFontSize(16);
  doc.text(formatCurrency(cotationData.totalGlobal), pageWidth / 2 + 50, infoY + 70);

  // === 3️⃣ Tableau des produits ===
  const tableStartY = infoY + 140;
  
  const tableBody = cotationData.produits.map((produit, index) => {
    const prixUnitaire = parseFloat(produit.prixAffiche) || 0;
    const commission = parseFloat(produit.commission) || 0;
    const poids = parseFloat(produit.poidsKg) || 0;
    const quantite = parseFloat(produit.quantite) || 0;
    const volumeM3 = calculateVolumeM3(produit);
    
    const prixTransport = cotationData.modeExpedition === "Air" 
      ? poids * PRIX_KG_AIR 
      : volumeM3 * PRIX_M3_MARITIME;
    
    const prixAchatCommissionne = prixUnitaire * (1 + commission / 100);
    const prixTotalUnitaire = prixAchatCommissionne + prixTransport;
    const prixTotalFinal = prixTotalUnitaire * quantite;

    return [
      index + 1,
      produit.nomProduit || 'Produit sans nom',
      produit.designation || '-',
      quantite.toString(),
      formatCurrency(prixUnitaire),
      `${commission}%`,
      formatCurrency(prixTransport),
      formatCurrency(prixTotalUnitaire),
      formatCurrency(prixTotalFinal)
    ];
  });

  doc.autoTable({
    startY: tableStartY,
    head: [[
      '#',
      'Produit',
      'Désignation', 
      'Qté',
      'Prix affiché',
      'Commission',
      'Transport',
      'Prix unitaire final',
      'Total'
    ]],
    body: tableBody,
    theme: 'striped',
    styles: { 
      fontSize: 9, 
      cellPadding: 8,
      valign: 'middle',
      halign: 'center'
    },
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 10
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 80, halign: 'left' },
      2: { cellWidth: 80, halign: 'left' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 60, halign: 'right' },
      5: { cellWidth: 50, halign: 'center' },
      6: { cellWidth: 60, halign: 'right' },
      7: { cellWidth: 70, halign: 'right' },
      8: { cellWidth: 70, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  // === 4️⃣ Images des produits ===
  let currentY = doc.lastAutoTable.finalY + 30;
  const imageWidth = 120;
  const imageHeight = 90;
  const imagesPerRow = 4;
  const imageSpacing = 20;
  const rowSpacing = 30;

  if (cotationData.produits.some(p => p.imageBase64)) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("APERÇU DES PRODUITS", margin, currentY);
    currentY += 30;

    cotationData.produits.forEach((produit, index) => {
      if (produit.imageBase64) {
        const col = index % imagesPerRow;
        const row = Math.floor(index / imagesPerRow);
        
        const x = margin + col * (imageWidth + imageSpacing);
        const y = currentY + row * (imageHeight + rowSpacing + 40);

        // Vérifier si on dépasse la page
        if (y + imageHeight + 40 > pageHeight - 50) {
          doc.addPage();
          currentY = 50;
        }
        
        const finalY = y > pageHeight - 50 ? 50 + row * (imageHeight + rowSpacing + 40) : y;

        try {
          doc.addImage(produit.imageBase64, "JPEG", x, finalY, imageWidth, imageHeight);
          
          // Nom du produit sous l'image
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const productName = produit.nomProduit.length > 20 
            ? produit.nomProduit.substring(0, 20) + "..." 
            : produit.nomProduit;
          doc.text(productName, x + imageWidth/2, finalY + imageHeight + 15, { align: "center" });
          
          // Prix final sous le nom
          doc.setFont("helvetica", "bold");
          doc.setTextColor(41, 128, 185);
          doc.text(formatCurrency(produit.total), x + imageWidth/2, finalY + imageHeight + 30, { align: "center" });
          
        } catch (error) {
          console.error(`Erreur ajout image produit ${index + 1}:`, error);
        }
      }
    });
  }

  // === 5️⃣ Footer ===
  const footerY = pageHeight - 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Devis généré le ${new Date().toLocaleDateString('fr-FR')} - Valable 30 jours`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // === 6️⃣ Sauvegarde ===
  const fileName = `Devis_${cotationData.client || 'Client'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  console.debug("✅ PDF généré avec succès:", fileName);
};

// Composant React principal (compatible avec votre code existant)
const DevisPDF = ({ cotation, onFinish }) => {
  useEffect(() => {
    const generatePDF = async () => {
      try {
        console.debug("🔄 Préparation du PDF de cotation...");
        
        // Convertir les images des produits
        const produitsWithImages = await convertProductsImagesToBase64(cotation.produits || []);
        
        // Calculer les totaux corrects pour chaque produit
        const produitsWithTotals = produitsWithImages.map(produit => ({
          ...produit,
          total: calculateProductTotal(produit, cotation.modeExpedition)
        }));
        
        // Calculer le total global
        const totalGlobal = produitsWithTotals.reduce((acc, produit) => acc + (produit.total || 0), 0);
        
        const enrichedCotation = {
          ...cotation,
          produits: produitsWithTotals,
          totalGlobal: totalGlobal
        };

        console.debug("✅ Images converties. Génération du PDF...");
        await generateCotationPDF(enrichedCotation);
        
        // Appeler onFinish après génération
        if (onFinish) onFinish();
        
      } catch (error) {
        console.error("❌ Erreur lors de la préparation du PDF:", error);
        if (onFinish) onFinish();
      }
    };

    generatePDF();
  }, [cotation, onFinish]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium">Génération du PDF en cours...</span>
        </div>
      </div>
    </div>
  );
};

export default DevisPDF;
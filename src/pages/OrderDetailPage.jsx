import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import axios from "axios";

const steps = [
  { key: "validé", label: "Payé" },
  { key: "depotShenzen", label: "En cours" },
  { key: "expeditionRDC", label: "Prêt à être livré" },
  { key: "receptionRDC", label: "Livré" },
];

const shippingIcons = { air: "✈️", sea: "🚢", land: "🚚" };

const StatusBar = ({ currentStep = "validé", percentage = 0 }) => {
  const safeStep = currentStep || "validé";
  const currentIndex = steps.findIndex((s) => s.key === safeStep);
  const stepLabel = currentIndex !== -1 ? steps[currentIndex].label : "Payé";

  return (
    <div className="flex flex-col items-center w-full max-w-[180px] mx-auto">
      <div className="relative w-full h-2 rounded bg-gray-300 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-2 rounded bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-gradient-move"
          style={{ width: `${percentage}%`, transition: "width 0.8s ease-in-out" }}
        />
      </div>
      <span className="text-xs text-gray-500 mt-1 text-center">
        {stepLabel} ({percentage}%)
      </span>
    </div>
  );
};

const getProgressStep = (createdAt) => {
  if (!createdAt) return { step: "validé", percent: 0, daysElapsed: 0, estimatedDelivery: "—" };
  const now = new Date();
  const created = new Date(createdAt);
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  const estimatedDelivery = new Date(created);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 8);

  let step = "validé";
  let percent = 0;

  if (diffDays <= 2) { step = "validé"; percent = Math.min((diffDays / 8) * 100, 20); }
  else if (diffDays <= 3) { step = "depotShenzen"; percent = Math.min((diffDays / 8) * 100, 50); }
  else if (diffDays <= 8) { step = "expeditionRDC"; percent = Math.min((diffDays / 8) * 100, 80); }
  else { step = "receptionRDC"; percent = 100; }

  return { step, percent: Math.round(percent), daysElapsed: diffDays, estimatedDelivery: estimatedDelivery.toLocaleDateString() };
};

async function translateWithGoogle(texts) {
  let results = [];
  for (const text of texts) {
    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {},
        {
          params: {
            q: text,
            target: "en",
            key: import.meta.env.VITE_GOOGLE_TRANSLATE_KEY
          }
        }
      );
      results.push(response.data.data.translations[0].translatedText);
    } catch (error) {
      console.error("Erreur traduction Google:", error.message);
      results.push(text);
    }
  }
  return results;
}

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paiementChine, setPaiementChine] = useState(0);
  const [paiementTransport, setPaiementTransport] = useState(0);
  const [loadingPDF, setLoadingPDF] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "commandes", orderId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const progress = getProgressStep(createdAt);

          setOrder({
            id: snapshot.id,
            ...data,
            createdAt: createdAt ? createdAt.toLocaleDateString() : "—",
            invoiceNumber: data.invoiceNumber || `INV-${snapshot.id.slice(0, 6)}`,
            currentStep: data.currentStep || progress.step,
            progressPercent: progress.percent,
            estimatedDelivery: progress.estimatedDelivery,
            produits: data.produits || [],
            total: data.total || 0,
            shippingMode: data.shippingMode || "standard",
          });

          setPaiementChine(data.paiementChine || 0);
          setPaiementTransport(data.paiementTransport || 0);
        } else {
          alert("Commande introuvable");
          navigate("/commandes");
        }
      } catch (error) {
        alert("Erreur chargement : " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  const handleStatusChange = async (newStep) => {
    if (!order) return;
    setOrder({ ...order, currentStep: newStep });
    try {
      const docRef = doc(db, "commandes", order.id);
      await updateDoc(docRef, { currentStep: newStep });
      alert("État de la commande mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour état :", err);
    }
  };

  const handleShippingModeChange = async (newMode) => {
    if (!order) return;
    setOrder({ ...order, shippingMode: newMode });
    try {
      const docRef = doc(db, "commandes", order.id);
      await updateDoc(docRef, { shippingMode: newMode });
      alert("Type d'expédition mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour expédition :", err);
    }
  };

  const addOrderDetailsToPDF = (pdf) => {
    pdf.setFontSize(18);
    pdf.text("Détail Commande", 105, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.text(`Commande #${order.id.slice(0, 6)}`, 20, 35);
    pdf.text(`Client : ${order.client || "—"}`, 20, 45);
    pdf.text(`Facture : ${order.invoiceNumber}`, 20, 55);
    pdf.text(`Date : ${order.createdAt}`, 20, 65);
    pdf.text(`Livraison estimée : ${order.estimatedDelivery}`, 20, 75);
    pdf.text(`Type d'expédition : ${order.shippingMode}`, 20, 85);
    pdf.text(`État : ${order.currentStep} (${order.progressPercent}%)`, 20, 95);
    pdf.text(`Total : ${order.total.toFixed(2)} $`, 20, 105);

    return 120;
  };

  const generateTranslatedProductPDF = async () => {
    if (!order || !order.produits) return;
    setLoadingPDF(true);
    try {
      const productNames = order.produits.map(p => p.designation);
      const translatedNames = await translateWithGoogle(productNames);

      const pdf = new jsPDF("p", "mm", "a4");
      let y = addOrderDetailsToPDF(pdf);

      for (let i = 0; i < order.produits.length; i++) {
        const prod = order.produits[i];
        pdf.setFontSize(14);
        pdf.text(`${translatedNames[i]}`, 20, y);
        y += 6;

        pdf.setFontSize(12);
        pdf.text(`Quantity: ${prod.quantite}`, 20, y);
        y += 6;
        pdf.text(`Unit Price: ${prod.prix} $`, 20, y);
        y += 6;
        pdf.text(`Total: ${prod.total} $`, 20, y);
        y += 6;

        if (prod.images && prod.images[0]) {
          const img = await loadImageAsBase64(prod.images[0]);
          pdf.addImage(img, "JPEG", 140, y - 18, 40, 40);
          y += 45;
        } else {
          y += 10;
        }

        if (y > 270 && i !== order.produits.length - 1) {
          pdf.addPage();
          y = 20;
        }
      }

      pdf.save(`Order_${order.id}_Products_EN.pdf`);
    } finally {
      setLoadingPDF(false);
    }
  };

  const sendEmailWithPDF = async () => {
    if (!order || !order.produits) return;
    setLoadingPDF(true);
    try {
      const productNames = order.produits.map(p => p.designation);
      const translatedNames = await translateWithGoogle(productNames);

      const pdf = new jsPDF("p", "mm", "a4");
      let y = addOrderDetailsToPDF(pdf);

      for (let i = 0; i < order.produits.length; i++) {
        const prod = order.produits[i];
        pdf.setFontSize(14);
        pdf.text(`${translatedNames[i]}`, 20, y);
        y += 6;

        pdf.setFontSize(12);
        pdf.text(`Quantity: ${prod.quantite}`, 20, y);
        y += 6;

        if (prod.images && prod.images[0]) {
          const img = await loadImageAsBase64(prod.images[0]);
          pdf.addImage(img, "JPEG", 140, y - 18, 40, 40);
          y += 45;
        } else {
          y += 10;
        }

        if (y > 270 && i !== order.produits.length - 1) {
          pdf.addPage();
          y = 20;
        }
      }

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append("pdf", pdfBlob, `Order_${order.id}_Products_EN.pdf`);
      formData.append("recipients", JSON.stringify([
        "congoalibaba@gmail.com",
        "1794635146@qq.com"
      ]));

      await axios.post("http://localhost:5000/send-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("📧 Email envoyé avec succès !");
    } catch (error) {
      console.error("Erreur envoi email:", error);
      alert("❌ Échec envoi email");
    } finally {
      setLoadingPDF(false);
    }
  };

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = reject;
    });
  };

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!order) return null;

  const benefice = (order.total - paiementChine - paiementTransport).toFixed(2);

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate("/commandes")} className="bg-gray-600 text-white px-3 py-2 rounded">
          ⬅ Retour
        </button>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          📄 Détail Commande 
          {order.shippingMode && (
            <span title="Mode d'expédition">{shippingIcons[order.shippingMode] || "📦"}</span>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={generateTranslatedProductPDF}
            className="bg-green-600 text-white px-3 py-2 rounded"
            disabled={loadingPDF}
          >
            {loadingPDF ? "⏳..." : "📄 Export Produits EN"}
          </button>
          <button
            onClick={sendEmailWithPDF}
            className="bg-blue-600 text-white px-3 py-2 rounded"
            disabled={loadingPDF}
          >
            {loadingPDF ? "📧 Envoi..." : "📧 Envoyer Email"}
          </button>
        </div>
      </div>

      <div id="pdf-content" className="bg-white shadow rounded p-4">
        <p className="text-lg font-semibold text-blue-600">
          Commande #{order.id.slice(0, 6)}
        </p>
        <p>Client : {order.client || "—"}</p>
        <p>Facture : {order.invoiceNumber}</p>
        <p>Date : {order.createdAt}</p>
        <p>Livraison estimée : {order.estimatedDelivery}</p>
        <p>Type d'expédition : {shippingIcons[order.shippingMode] || "📦"} {order.shippingMode}</p>
        <p>Total : <b>{order.total.toFixed(2)} $</b></p>

        <div className="mt-4">
          <StatusBar currentStep={order.currentStep} percentage={order.progressPercent} />
        </div>

        {role === "admin" && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-600 mb-3">💰 Détails Dépenses</h3>
            <label className="block mb-2">
              Paiement Chine ($)
              <input
                type="number"
                value={paiementChine}
                onChange={(e) => setPaiementChine(e.target.value)}
                className="border rounded px-3 py-2 w-full mt-1"
              />
            </label>
            <label className="block mb-2">
              Paiement frais de transport ($)
              <input
                type="number"
                value={paiementTransport}
                onChange={(e) => setPaiementTransport(e.target.value)}
                className="border rounded px-3 py-2 w-full mt-1"
              />
            </label>
            <label className="block mb-2">
              État de la commande
              <select
                value={order.currentStep}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border rounded px-3 py-2 w-full mt-1"
              >
                {steps.map((step) => (
                  <option key={step.key} value={step.key}>
                    {step.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-2">
              Type d'expédition
              <select
                value={order.shippingMode}
                onChange={(e) => handleShippingModeChange(e.target.value)}
                className="border rounded px-3 py-2 w-full mt-1"
              >
                <option value="air">Air ✈️</option>
                <option value="sea">Mer 🚢</option>
                <option value="land">Terre 🚚</option>
              </select>
            </label>
            <p className="text-green-700 font-bold mt-2">
              Bénéfice estimé : {benefice} $
            </p>
          </div>
        )}

        {order.produits.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Produits :</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.produits.map((prod, idx) => (
                <div
                  key={idx}
                  className="border p-4 rounded-lg shadow-sm flex flex-col items-center text-center"
                >
                  {prod.images && prod.images[0] && (
                    <img
                      src={prod.images[0]}
                      alt="Produit"
                      className="w-32 h-32 object-cover mb-2 rounded-md"
                    />
                  )}
                  <p className="font-bold text-lg">{prod.designation}</p>
                  <p>Quantité : {prod.quantite}</p>
                  <p>Prix unitaire : {prod.prix} $</p>
                  <p className="font-semibold mt-1">Total : {prod.total} $</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;

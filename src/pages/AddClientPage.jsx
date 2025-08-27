import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";

const AddClientPage = () => {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "clients"), {
        nom,
        telephone,
        email,
        adresse,
        createdAt: serverTimestamp(),
      });
      alert("✅ Client ajouté avec succès !");
      navigate("/clients");
    } catch (error) {
      alert("❌ Erreur lors de l’ajout : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 min-h-screen flex flex-col items-center text-white">
      {/* Header */}
      <div className="sticky top-0 w-full bg-white/20 backdrop-blur-md shadow flex items-center justify-between px-4 py-3 mb-6 rounded-lg">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-white hover:text-gray-200"
        >
          <FaArrowLeft className="mr-2" /> Retour
        </button>
        <h2 className="text-lg font-bold">➕ Ajouter un client</h2>
        <div></div>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white text-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg"
      >
        <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaUser className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="flex-1 outline-none"
            required
          />
        </div>

        <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaPhone className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="flex-1 outline-none"
            required
          />
        </div>

        <div className="flex items-center border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaEnvelope className="text-gray-400 mr-3" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 outline-none"
          />
        </div>

        <div className="flex items-start border rounded px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaMapMarkerAlt className="text-gray-400 mt-1 mr-3" />
          <textarea
            placeholder="Adresse de livraison"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="flex-1 outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-4 justify-end mt-4">
          <button
            type="button"
            onClick={() => navigate("/clients")}
            className="flex items-center bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded shadow"
          >
            <FaArrowLeft className="mr-2" /> Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <FaSave className="mr-2" />{" "}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClientPage;

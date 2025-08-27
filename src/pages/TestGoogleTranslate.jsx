import React, { useState } from "react";
import axios from "axios";

const TestGoogleTranslate = () => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const handleTranslate = async () => {
    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {},
        {
          params: {
            q: inputText,
            target: "en", // traduction vers anglais
            key: import.meta.env.VITE_GOOGLE_TRANSLATE_KEY,
          },
        }
      );
      setTranslatedText(response.data.data.translations[0].translatedText);
    } catch (error) {
      console.error("Erreur traduction:", error.message);
      alert("Erreur API : Vérifie ta clé et les quotas");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Test Google Translate API</h2>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Entrez du texte en français..."
        className="border rounded p-3 w-80 h-24 mb-3"
      />

      <button
        onClick={handleTranslate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Traduire en Anglais
      </button>

      {translatedText && (
        <div className="mt-4 bg-white shadow p-4 rounded w-80">
          <h3 className="font-semibold">Résultat :</h3>
          <p>{translatedText}</p>
        </div>
      )}
    </div>
  );
};

export default TestGoogleTranslate;

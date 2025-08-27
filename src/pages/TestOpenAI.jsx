import React, { useState } from "react";
import axios from "axios";

const TestOpenAI = () => {
  const [input, setInput] = useState("Bonjour");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const translateText = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Translate to English without explanation." },
            { role: "user", content: input },
          ],
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // ✅ Corrigé pour Vite
            "Content-Type": "application/json",
          },
        }
      );
      setResult(response.data.choices[0].message.content.trim());
    } catch (error) {
      console.error("Erreur API:", error.response?.data || error.message);
      setResult("❌ Erreur de traduction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">🔑 Test OpenAI Translation</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border px-4 py-2 rounded w-64 mb-3"
        placeholder="Texte à traduire"
      />
      <button
        onClick={translateText}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "⏳ Traduction..." : "Traduire"}
      </button>
      {result && (
        <p className="mt-4 text-lg bg-white p-3 rounded shadow">
          ✅ Traduction : {result}
        </p>
      )}
    </div>
  );
};

export default TestOpenAI;

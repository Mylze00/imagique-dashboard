import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const transactions = [
  { type: 'Entrée', categorie: 'Paiement client', montant: 270 },
  { type: 'Entrée', categorie: 'Frais de service', montant: 50 },
  { type: 'Sortie', categorie: 'Achat produit', montant: 210 },
  { type: 'Sortie', categorie: 'Douane', montant: 25 },
  { type: 'Sortie', categorie: 'Transport', montant: 30 },
];

const chartData = [
  { semaine: 'S1', entrees: 320, sorties: 150 },
  { semaine: 'S2', entrees: 400, sorties: 230 },
  { semaine: 'S3', entrees: 200, sorties: 300 },
];

const FinancesPage = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Suivi financier</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2 text-green-700">Entrées</h3>
          <ul className="text-sm text-gray-700">
            {transactions.filter(t => t.type === 'Entrée').map((t, i) => (
              <li key={i}>✅ {t.categorie} : {t.montant} $</li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2 text-red-700">Dépenses</h3>
          <ul className="text-sm text-gray-700">
            {transactions.filter(t => t.type === 'Sortie').map((t, i) => (
              <li key={i}>❌ {t.categorie} : {t.montant} $</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white mt-6 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Entrées / Sorties par semaine</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="semaine" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entrees" fill="#22c55e" />
            <Bar dataKey="sorties" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancesPage;

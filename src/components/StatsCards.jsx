import React from 'react';

const cards = [
  { title: "Commandes en cours", value: 8 },
  { title: "Commandes livrées", value: 23 },
  { title: "Revenus ce mois", value: "2 700 $" },
  { title: "Dépenses internes", value: "950 $" },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-gray-600 text-sm">{card.title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

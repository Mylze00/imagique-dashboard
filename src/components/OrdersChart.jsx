import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { semaine: 'S1', commandes: 8 },
  { semaine: 'S2', commandes: 12 },
  { semaine: 'S3', commandes: 5 },
  { semaine: 'S4', commandes: 15 },
  { semaine: 'S5', commandes: 10 },
];

const OrdersChart = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Progression des commandes par semaine</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="semaine" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="commandes" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersChart;

import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OrdersChart = ({ orders }) => {
  const [filter, setFilter] = useState("mois");

  const grouped = {};
  orders.forEach((order) => {
    const date = order.createdAt?.toDate?.() || new Date();
    const key =
      filter === "jour"
        ? date.toLocaleDateString()
        : `${date.getMonth() + 1}/${date.getFullYear()}`;

    if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
    grouped[key].total += order.total || 0;
    grouped[key].count += 1;
  });

  const labels = Object.keys(grouped);
  const totals = labels.map((key) => grouped[key].total);
  const counts = labels.map((key) => grouped[key].count);

  const data = {
    labels,
    datasets: [
      {
        label: "Revenu ($)",
        data: totals,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
      },
      {
        label: "Nombre de commandes",
        data: counts,
        backgroundColor: "rgba(16, 185, 129, 0.6)",
      },
    ],
  };

  return (
    <div className="transform scale-90 origin-top">
      <div className="flex justify-end mb-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-1 text-sm"
        >
          <option value="jour">Jour</option>
          <option value="mois">Mois</option>
        </select>
      </div>
      <Bar data={data} />
    </div>
  );
};

export default OrdersChart;

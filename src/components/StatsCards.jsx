import React from "react";
import { FaShoppingCart, FaCheckCircle, FaHourglassHalf, FaDollarSign } from "react-icons/fa";
import { Link } from "react-router-dom";

const StatsCards = ({ orders, role }) => {
  const totalOrders = orders.length;

  const completedOrders = orders.filter(
    (o) =>
      o.status &&
      ["validé", "receptionrdc"].includes(o.status.toLowerCase())
  ).length;

  const pendingOrders = orders.filter(
    (o) =>
      o.status &&
      ["depotshenzen", "expeditionrdc"].includes(o.status.toLowerCase())
  ).length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const stats = [
    {
      title: "Total commandes",
      value: totalOrders,
      icon: <FaShoppingCart />,
      color: "bg-blue-100 text-blue-700",
      link: "/commandes",
    },
    {
      title: "Commandes terminées",
      value: completedOrders,
      icon: <FaCheckCircle />,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "En attente",
      value: pendingOrders,
      icon: <FaHourglassHalf />,
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  if (role === "admin") {
    stats.push({
      title: "Revenu total",
      value: `${totalRevenue.toFixed(2)} $`,
      icon: <FaDollarSign />,
      color: "bg-purple-100 text-purple-700",
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, idx) => {
        const cardContent = (
          <div
            className={`flex items-center p-4 rounded-xl shadow hover:shadow-lg transition cursor-pointer ${stat.color}`}
          >
            <div className="text-2xl mr-3">{stat.icon}</div>
            <div>
              <h3 className="text-sm font-semibold">{stat.title}</h3>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        );

        return stat.link ? (
          <Link key={idx} to={stat.link}>
            {cardContent}
          </Link>
        ) : (
          <div key={idx}>{cardContent}</div>
        );
      })}
    </div>
  );
};

export default StatsCards;

import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import OrdersChart from '../components/OrdersChart';

const DashboardPage = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="p-6">
          <StatsCards />
          <OrdersChart />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

import { useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import StatsCards from "@/components/stats-cards";
import RecentSales from "@/components/recent-sales";
import QuickAccess from "@/components/quick-access";

export default function DashboardPage() {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isVisible={sidebarVisible} />
        
        <main className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-600">Bem-vindo ao Sistema PDV</p>
          </div>
          
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentSales />
            </div>
            <div>
              <QuickAccess />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

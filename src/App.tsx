import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { ItemCatalogView } from './components/ItemCatalogView';
import { TransactionsView } from './components/TransactionsView';
import { StockOpnameView } from './components/StockOpnameView';
import { ReportsView } from './components/ReportsView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { TransactionModal } from './components/TransactionModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { MasterSettingsModal } from './components/MasterSettingsModal';
import { UserAccessManagementView } from './components/UserAccessManagementView';
import { LoginView } from './components/LoginView';
import { FuelLogView } from './components/FuelLogView';

const MainLayout: React.FC = () => {
  const { activeTab, isAuthenticated } = useInventory();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsDesktopSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Responsive Sidebar (Mobile & Desktop Hideable) */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          isDesktopOpen={isDesktopSidebarOpen}
          onToggleDesktop={() => setIsDesktopSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'items' && <ItemCatalogView />}
          {activeTab === 'stock-in' && <TransactionsView initialType="MASUK" />}
          {activeTab === 'stock-out' && <TransactionsView initialType="KELUAR" />}
          {activeTab === 'fuel-log' && <FuelLogView />}
          {activeTab === 'opname' && <StockOpnameView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'user-access' && <UserAccessManagementView />}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation */}
      <MobileBottomNav />

      {/* Modals & Dialogs */}
      <ItemDetailModal />
      <ItemFormModal />
      <TransactionModal />
      <BarcodeScannerModal />
      <PrintDocumentModal />
      <MasterSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}

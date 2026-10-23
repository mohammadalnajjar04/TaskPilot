import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "../components/layout/Sidebar";
import { MobileSidebar } from "../components/layout/MobileSidebar";
import { Header } from "../components/layout/Header";

export function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebar open={isMobileMenuOpen} onClose={closeMobileMenu} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header
          onOpenMobileMenu={openMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

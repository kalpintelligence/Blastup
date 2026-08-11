'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

// Context so Header can trigger the mobile sidebar toggle
interface MobileNavContextType {
  toggleMobileSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  toggleMobileSidebar: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close drawer on resize above breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <MobileNavContext.Provider value={{ toggleMobileSidebar: () => setMobileOpen((p) => !p) }}>
      <div className={`app-layout ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile Drawer Backdrop */}
        {mobileOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Close Mobile Sidebar"
          />
        )}

        {/* Sidebar with mobile toggle prop */}
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main Content Area */}
        <main className="main-wrapper">
          {children}
        </main>
      </div>
    </MobileNavContext.Provider>
  );
}

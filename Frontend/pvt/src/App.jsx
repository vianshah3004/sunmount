import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';
import AuthPage from './pages/AuthPage';
import SrsDashboard from './pages/SrsDashboard';
import SrsInventory from './pages/SrsInventory';
import SrsSales from './pages/SrsSales';
import SrsPurchase from './pages/SrsPurchase';
import SrsManufacturing from './pages/SrsManufacturing';
import SrsCustomers from './pages/SrsCustomers';
import SrsHistory from './pages/SrsHistory';
import SrsSettings from './pages/SrsSettings';
import SrsNotificationPanel from './components/SrsNotificationPanel';
import SrsOrderDetailModal from './components/SrsOrderDetailModal';
import SrsOrderComposer from './pages/SrsOrderComposer';
import { getAuthSession, isAuthenticated, logoutUser } from './lib/api';

const pageMeta = {
  '/': {
    title: 'Operations Dashboard',
    subtitle: 'Summary cards, live workflow status, and quick access to products, sales, purchases, manufacturing, and history.',
    searchPlaceholder: 'Search across inventory, orders, and WIP...',
  },
  '/inventory': {
    title: 'Products & Inventory',
    subtitle: 'Master/detail list for products with quantity, price, and stock actions aligned to the inventory schema.',
    searchPlaceholder: 'Search products by code, name, or status...',
  },
  '/sales': {
    title: 'Sales Orders',
    subtitle: 'Quotation to packing to dispatch flow with unlimited line items, customer autofill, and INR totals.',
    searchPlaceholder: 'Search sales orders...',
  },
  '/purchase': {
    title: 'Purchase Orders',
    subtitle: 'Supplier autofill, quotation received, paid/unpaid, completion, and history for procurement workflows.',
    searchPlaceholder: 'Search purchase orders...',
  },
  '/manufacturing': {
    title: 'Manufacturing WIP',
    subtitle: 'Batch tracking, raw materials, output, status updates, and production log actions.',
    searchPlaceholder: 'Search batches...',
  },
  '/history': {
    title: 'Order History',
    subtitle: 'Separate views for sales, purchases, and manufacturing with export controls and filter chips.',
    searchPlaceholder: 'Search history entries...',
  },
  '/customers': {
    title: 'Customers & Suppliers',
    subtitle: 'Master/detail navigation with search, sortable list behavior, and contextual actions.',
    searchPlaceholder: 'Search customers or suppliers...',
  },
  '/reports': {
    title: 'Order History',
    subtitle: 'Separate views for sales, purchases, and manufacturing with export controls and filter chips.',
    searchPlaceholder: 'Search history entries...',
  },
  '/settings': {
    title: 'System Settings',
    subtitle: 'Shared login, currency, sync, encryption, backups, and integration preferences for the cloud-hosted system.',
    searchPlaceholder: 'Search settings...',
  },
  '/order/edit': {
    title: 'Order Composer',
    subtitle: 'Unified create/edit workspace for unlimited line items and auto-filled entity details.',
    searchPlaceholder: 'Search products for the order...',
  },
};

function AppShell({ authUser, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [booting, setBooting] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const shellOffsetClass = sidebarOpen ? 'overflow-hidden md:overflow-visible' : 'overflow-x-hidden';

  const meta = pageMeta[location.pathname] ?? pageMeta['/'];

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 220);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTransitioning(true);
    setSidebarOpen(false);
    const timer = window.setTimeout(() => setTransitioning(false), 140);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="app-shell text-on-surface bg-[radial-gradient(circle_at_top_left,_rgba(0,87,194,0.10),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(91,60,221,0.08),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_100%)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} authUser={authUser} />

      <div className={`min-h-screen ml-0 p-3 sm:p-4 md:ml-20 md:p-6 lg:ml-64 ${shellOffsetClass}`}>
        <div className="sticky top-4 z-30">
          <Topbar
            title={meta.title}
            subtitle={meta.subtitle}
            searchPlaceholder={meta.searchPlaceholder}
            onMenuClick={() => setSidebarOpen(true)}
            onNotificationsClick={() => setShowNotifications(true)}
            authUser={authUser}
            onLogout={onLogout}
          />
        </div>

        <div className={`app-content transition-opacity duration-150 ${transitioning ? 'opacity-70' : 'opacity-100'}`}>
          <Routes>
            <Route path="/" element={<SrsDashboard onOrderClick={() => setShowOrderDetail(true)} />} />
            <Route path="/inventory" element={<SrsInventory />} />
            <Route path="/sales" element={<SrsSales onOrderClick={() => setShowOrderDetail(true)} />} />
            <Route path="/purchase" element={<SrsPurchase />} />
            <Route path="/manufacturing" element={<SrsManufacturing />} />
            <Route path="/history" element={<SrsHistory />} />
            <Route path="/customers" element={<SrsCustomers />} />
            <Route path="/reports" element={<SrsHistory />} />
            <Route path="/settings" element={<SrsSettings />} />
            <Route path="/order/edit" element={<SrsOrderComposer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {(booting || transitioning) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 backdrop-blur-sm pointer-events-none transition-opacity duration-200">
          <div className="mx-6 w-full max-w-md rounded-[2rem] border border-outline-variant/20 bg-white p-6 shadow-2xl">
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full animate-pulse"></div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-outline font-black">Loading workspace</p>
                <p className="text-sm text-slate-500">Preparing inventory, orders, WIP, and history views.</p>
              </div>
              <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
            </div>
          </div>
        </div>
      )}

      {showNotifications && (
        <SrsNotificationPanel onClose={() => setShowNotifications(false)} />
      )}

      {showOrderDetail && (
        <SrsOrderDetailModal onClose={() => setShowOrderDetail(false)} />
      )}
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => getAuthSession());

  const handleAuthenticated = (nextSession) => {
    setSession(nextSession);
  };

  const handleLogout = async () => {
    await logoutUser();
    setSession(null);
  };

  const authenticated = isAuthenticated() && Boolean(session?.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={authenticated ? <Navigate to="/" replace /> : <AuthPage onAuthenticated={handleAuthenticated} />}
        />
        <Route
          path="*"
          element={
            authenticated ? (
              <AppShell authUser={session} onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

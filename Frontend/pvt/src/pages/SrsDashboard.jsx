import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { formatINR, formatShortDate } from '../lib/formatters';
import { getDashboardMetrics, getHistoryRecords } from '../lib/api';
import {
  createPollingFallback,
  initSocket,
  onInventoryUpdate,
  onManufacturingUpdate,
  onOrderUpdate,
  onSocketConnectionChange,
} from '../lib/socket';

const quickModules = [
  { label: 'Products', icon: 'inventory_2', to: '/inventory' },
  { label: 'Sales', icon: 'payments', to: '/sales' },
  { label: 'Purchases', icon: 'shopping_cart', to: '/purchase' },
  { label: 'Manufacturing', icon: 'factory', to: '/manufacturing' },
  { label: 'History', icon: 'history', to: '/history' },
  { label: 'Customers', icon: 'group', to: '/customers' },
];

export default function SrsDashboard({ onOrderClick }) {
  const [dashboardMetrics, setDashboardMetrics] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [metrics, history] = await Promise.all([
          getDashboardMetrics(),
          getHistoryRecords({ page: 1, pageSize: 3, sort: 'date', order: 'desc' }),
        ]);
        if (!active) {
          return;
        }
        setDashboardMetrics(metrics);
        setRecentTransactions(history.rows);
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(requestError.message || 'Unable to load dashboard data');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    initSocket();
    const fallback = createPollingFallback(load, 12000);
    const unsubscribeConnection = onSocketConnectionChange((connected) => {
      if (connected) {
        fallback.stop();
        return;
      }
      void fallback.run();
      fallback.start();
    });
    const unsubscribeOrder = onOrderUpdate(() => {
      void load();
    });
    const unsubscribeInventory = onInventoryUpdate(() => {
      void load();
    });
    const unsubscribeManufacturing = onManufacturingUpdate(() => {
      void load();
    });

    return () => {
      active = false;
      fallback.stop();
      unsubscribeConnection();
      unsubscribeOrder();
      unsubscribeInventory();
      unsubscribeManufacturing();
    };
  }, []);

  const metricCards = useMemo(() => dashboardMetrics, [dashboardMetrics]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <article key={metric.label} className="rounded-[1.5rem] sm:rounded-[2rem] bg-white/85 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className={`w-10 sm:w-11 h-10 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg ${metric.tone === 'primary' ? 'bg-primary/10 text-primary' : metric.tone === 'secondary' ? 'bg-secondary/10 text-secondary' : metric.tone === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 'bg-cyan-100 text-cyan-700'}`}>
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{metric.icon}</span>
              </div>
              <span className="text-[9px] sm:text-xs font-black text-secondary uppercase tracking-[0.2em]">{metric.delta}</span>
            </div>
            <p className="text-xs sm:text-sm text-outline font-semibold">{metric.label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-on-surface">{metric.value}</p>
          </article>
        ))}
      </section>

      {loading && (
        <section className="rounded-[1.5rem] sm:rounded-[2rem] bg-surface-container-low p-3 sm:p-4 text-xs sm:text-sm font-bold text-slate-600">Loading dashboard data...</section>
      )}
      {error && (
        <section className="rounded-[1.5rem] sm:rounded-[2rem] bg-error/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-error">{error}</section>
      )}

      <section className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 lg:p-8 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] overflow-hidden relative">
          <div className="flex flex-col sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Workflow overview</p>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface mt-2">Sales, Purchases, Manufacturing</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">A single operational view for high-volume inventory work with quick navigation to every core module.</p>
            </div>
            <div className="rounded-full border border-secondary/20 bg-secondary/10 px-3 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-secondary whitespace-nowrap">Cloud live</div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
            {quickModules.map((module) => (
              <Link key={module.label} to={module.to} className="group rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5 border border-outline-variant/15 hover:border-primary/20 hover:bg-white transition-all">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined">{module.icon}</span>
                </div>
                <h4 className="font-bold text-on-surface text-sm sm:text-base">{module.label}</h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Open module</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-container p-4 sm:p-6 text-white shadow-lg shadow-primary/15">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/75 font-black">Dashboard load</p>
              <p className="text-2xl sm:text-3xl font-black mt-2">&lt; 2s</p>
              <p className="text-xs sm:text-sm text-white/80 mt-2">Lightweight client rendering for immediate visibility.</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-4 sm:p-6 border border-outline-variant/15">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-outline font-black">Order capacity</p>
              <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">100+</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">Designed for large sales and purchase line-item lists.</p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-4 sm:p-6 border border-outline-variant/15">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-outline font-black">Realtime sync</p>
              <p className="text-2xl sm:text-3xl font-black text-on-surface mt-2">Cloud</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">Desktop and web data stay aligned through the backend.</p>
            </div>
          </div>
        </article>

        <aside className="space-y-4 sm:space-y-6">
          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Recent movements</p>
                <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Ledger snapshot</h3>
              </div>
              <button onClick={onOrderClick} className="px-3 sm:px-4 py-2 rounded-full bg-primary text-white text-xs sm:text-sm font-bold whitespace-nowrap">Open order</button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-surface-container-low p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface text-sm sm:text-base">{entry.party}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{entry.type} • {entry.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-on-surface text-sm sm:text-base">{typeof entry.value === 'number' ? formatINR(entry.value) : entry.value}</p>
                    <p className="text-[10px] sm:text-xs text-outline mt-1">{formatShortDate(entry.date)}</p>
                  </div>
                </div>
              ))}
              {!loading && !recentTransactions.length && (
                <p className="text-xs sm:text-sm text-slate-500">No recent history found.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Operational note</p>
            <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Shared login, cloud backups, HTTPS, AES-256</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed">The settings model reflects the internal deployment assumptions in the SRS without adding unnecessary role-based complexity.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

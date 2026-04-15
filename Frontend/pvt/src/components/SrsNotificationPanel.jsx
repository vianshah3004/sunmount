import { useEffect, useState } from 'react';
import { getDashboardMetrics, getHistoryRecords } from '../lib/api';

function toAlertFromMetric(metric) {
  if (metric.label === 'Low Stock Items') {
    return ['error', 'Low Stock Watch', `${metric.value} items currently flagged as low stock.`, 'Live'];
  }
  if (metric.label === 'Pending Orders') {
    return ['primary', 'Pending Orders', `${metric.value} orders are currently in pending stages.`, 'Live'];
  }
  return ['secondary', metric.label, `Current value: ${metric.value}`, 'Live'];
}

export default function SrsNotificationPanel({ onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [metrics, history] = await Promise.all([
          getDashboardMetrics(),
          getHistoryRecords({ page: 1, pageSize: 3, sort: 'date', order: 'desc' }),
        ]);
        if (!active) {
          return;
        }

        const metricAlerts = metrics.slice(0, 2).map(toAlertFromMetric);
        const historyAlerts = history.rows.map((row) => [
          row.type === 'Manufacturing' ? 'secondary' : 'primary',
          `${row.type} update`,
          `${row.party} moved to ${row.status}.`,
          new Date(row.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        ]);

        setAlerts([...metricAlerts, ...historyAlerts]);
      } catch (_error) {
        if (active) {
          setAlerts([
            ['error', 'Backend unavailable', 'Unable to load notifications from API.', 'Now'],
          ]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose}></div>
      <aside className="responsive-modal-narrow absolute inset-x-4 top-4 bottom-4 ml-auto flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/90 shadow-[0px_24px_60px_rgba(0,87,194,0.15)] sm:inset-x-6 md:inset-x-auto md:right-4 md:w-[24rem]">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 p-5 sm:p-6">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Live alerts</p>
            <h3 className="text-2xl font-black text-on-surface mt-2">Notifications</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-4 sm:p-5">
          {loading && <p className="text-sm font-bold text-slate-500">Loading notifications...</p>}
          {!loading && alerts.map(([tone, title, detail, time]) => (
            <div key={`${title}-${time}`} className={`rounded-[1.5rem] p-4 border-l-4 ${tone === 'error' ? 'border-error bg-error/5' : tone === 'primary' ? 'border-primary bg-primary/5' : 'border-secondary bg-secondary/5'}`}>
              <div className="flex justify-between gap-3">
                <h4 className="font-black text-on-surface">{title}</h4>
                <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">{time}</span>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-outline-variant/10 p-4">
          <button className="w-full rounded-2xl bg-primary text-white px-4 py-3 text-sm font-black">Mark all as read</button>
        </div>
      </aside>
    </div>
  );
}

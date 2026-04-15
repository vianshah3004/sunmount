import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatShortDate } from '../lib/formatters';
import { deleteCoreOrder, getSalesOrderLines, getSalesOrders } from '../lib/api';

export default function SrsOrderDetailModal({ onClose }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const orders = await getSalesOrders({ page: 1, pageSize: 1, sort: 'updated', order: 'desc' });
        const latest = orders.rows[0];
        if (!latest) {
          if (active) {
            setOrder(null);
            setItems([]);
          }
          return;
        }

        const lines = await getSalesOrderLines(latest.id);
        if (!active) {
          return;
        }
        setOrder(latest);
        setItems(lines.lines.map((line) => [line.code, line.quantity, line.unitPrice]));
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load order detail');
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

  const total = useMemo(() => items.reduce((sum, [, qty, price]) => sum + qty * price, 0), [items]);

  const handleEdit = () => {
    if (!order?.id) {
      return;
    }
    navigate('/order/edit', { state: { orderId: order.id } });
    onClose();
  };

  const handleRemove = async () => {
    if (!order?.id || removing) {
      return;
    }

    const confirmed = window.confirm(`Remove order #${order.id}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setRemoving(true);
    setError('');
    try {
      await deleteCoreOrder(order.id);
      onClose();
      window.location.reload();
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove order');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-md sm:p-4">
      <div className="responsive-modal flex w-full flex-col overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/95 shadow-[0px_24px_60px_rgba(0,87,194,0.15)]">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 p-4 sm:p-6">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Order detail</p>
            <h3 className="text-2xl font-black text-on-surface mt-2">Order #{order?.id ?? 'N/A'}</h3>
            <p className="text-slate-500 mt-2">Quotation, packing, dispatch, and history actions in one context panel.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid gap-6 overflow-auto p-4 sm:p-6 xl:grid-cols-[0.86fr_1.14fr]">
          <section className="rounded-[1.5rem] bg-surface-container-low p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-black">{order?.status ?? 'Processing'}</span>
              <span className="text-xs font-black uppercase tracking-[0.22em] text-outline">{order?.stage ?? '-'}</span>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Customer</span><span className="font-bold text-on-surface">{order?.customer ?? '-'}</span></div>
              <div className="flex justify-between"><span>Customer ID</span><span className="font-bold text-on-surface">{order?.customerId ?? '-'}</span></div>
              <div className="flex justify-between"><span>Date</span><span className="font-bold text-on-surface">{order?.updated ? formatShortDate(order.updated) : '-'}</span></div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Detail actions</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button onClick={handleEdit} disabled={!order?.id} className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface disabled:opacity-50 sm:w-auto">Edit</button>
                <button onClick={() => void handleRemove()} disabled={!order?.id || removing} className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface disabled:opacity-50 sm:w-auto">
                  {removing ? 'Removing...' : 'Remove'}
                </button>
                <button className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white sm:w-auto">Next Stage</button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-surface-container-low p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black text-on-surface">Line items</h4>
              <span className="text-xs font-black uppercase tracking-[0.22em] text-outline">{items.length} items</span>
            </div>
            {loading && <p className="text-sm text-slate-500 mb-3">Loading order detail...</p>}
            {error && <p className="text-sm text-error mb-3">{error}</p>}
            <div className="responsive-table-wrap w-full overflow-x-auto rounded-[1.25rem] border border-outline-variant/15 bg-white">
              <table className="responsive-table w-full min-w-[800px] border-collapse text-left lg:min-w-full">
                <thead className="bg-surface-container-low">
                  <tr className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4 text-center">Qty</th>
                    <th className="px-4 py-4 text-right">Price</th>
                    <th className="px-4 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(([name, qty, price]) => (
                    <tr key={`${name}-${qty}-${price}`} className="border-t border-outline-variant/10">
                      <td className="px-4 py-4">
                        <p className="font-bold text-on-surface">{name}</p>
                      </td>
                      <td className="px-4 py-4 text-center font-bold">{qty}</td>
                      <td className="px-4 py-4 text-right font-bold">{formatINR(price)}</td>
                      <td className="px-4 py-4 text-right font-black">{formatINR(qty * price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-[1.25rem] bg-primary px-4 py-4 text-white">
              <span className="font-black">Total invoice amount</span>
              <span className="text-xl font-black">{formatINR(total)}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

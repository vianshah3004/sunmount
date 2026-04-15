import { useEffect, useMemo, useState } from 'react';
import { formatINR, formatShortDateTime } from '../lib/formatters';
import { getInventory, patchInventoryQuantity } from '../lib/api';
import { createPollingFallback, initSocket, onInventoryUpdate, onLowStock, onSocketConnectionChange } from '../lib/socket';

const statusTone = {
  'In Stock': 'bg-secondary/10 text-secondary',
  'Auto-Refill': 'bg-tertiary/10 text-tertiary',
  'Low Stock': 'bg-amber-100 text-amber-700',
  Critical: 'bg-error/10 text-error',
};

export default function SrsInventory() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [sortKey, setSortKey] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getInventory({ page: 1, pageSize: 200 });
        if (!active) {
          return;
        }
        setItems(response.rows);
        if (response.rows[0]) {
          setSelectedCode((current) => current || response.rows[0].code);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(requestError.message || 'Unable to load inventory');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    // Initialize socket and setup listeners
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

    const unsubscribeInventory = onInventoryUpdate((payload) => {
      if (!active) {
        return;
      }
      // Update the item with the new quantity
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.code === payload.productCode
            ? { ...item, quantity: payload.newQuantity }
            : item
        )
      );
    });

    const unsubscribeLowStock = onLowStock((payload) => {
      if (!active) {
        return;
      }
      setFeedback(`⚠️ Low stock alert: ${payload.productCode} (${payload.quantity} remaining)`);
    });

    return () => {
      active = false;
      fallback.stop();
      unsubscribeConnection();
      unsubscribeInventory();
      unsubscribeLowStock();
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searched = items
      .filter((item) => (statusFilter === 'All' ? true : item.status === statusFilter))
      .filter((item) => [item.code, item.name, item.description, item.status].some((value) => String(value ?? '').toLowerCase().includes(normalized)));

    const sorted = [...searched].sort((a, b) => {
      let result = 0;
      if (sortKey === 'code') result = a.code.localeCompare(b.code);
      if (sortKey === 'name') result = a.name.localeCompare(b.name);
      if (sortKey === 'weight') result = Number.parseFloat(a.weight) - Number.parseFloat(b.weight);
      if (sortKey === 'price') result = a.price - b.price;
      if (sortKey === 'quantity') result = a.quantity - b.quantity;
      if (sortKey === 'status') result = a.status.localeCompare(b.status);
      if (sortKey === 'updated') result = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      return sortDirection === 'asc' ? result : -result;
    });
    return sorted;
  }, [items, query, sortKey, sortDirection, statusFilter]);

  const selectedItem = filteredItems.find((item) => item.code === selectedCode) ?? filteredItems[0] ?? items[0] ?? null;

  const statusOptions = useMemo(() => {
    const set = new Set(items.map((item) => item.status));
    return ['All', ...Array.from(set)];
  }, [items]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const updateQuantity = async (delta, reason) => {
    if (!selectedItem) {
      return;
    }
    try {
      const updated = await patchInventoryQuantity(selectedItem.id, { delta, reason });
      setItems((currentItems) => currentItems.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback(delta > 0 ? 'Stock increased' : 'Stock adjusted');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update stock');
    }
  };

  return (
    <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[1.18fr_0.82fr]">
      <section className="rounded-[2rem] bg-white/90 border border-outline-variant/20 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-outline-variant/10 flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Product master</p>
            <h3 className="text-xl sm:text-2xl font-black text-on-surface mt-2">Scrollable product list</h3>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-3 xl:w-auto">
            <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-surface-container-low px-3 py-2 sm:px-4 sm:py-3 sm:flex-1 xl:w-64">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-transparent outline-none border-none w-full text-xs sm:text-sm" placeholder="Search products..." />
            </div>
            <button onClick={() => toggleSort('updated')} className="w-full rounded-2xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface whitespace-nowrap sm:w-auto sm:px-4 sm:py-3 sm:text-sm xl:w-auto">Sort</button>
            <button onClick={() => setFilterModalOpen(true)} className="w-full rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white whitespace-nowrap sm:w-auto sm:px-4 sm:py-3 sm:text-sm xl:w-auto">Filter</button>
          </div>
        </div>

        <div className="h-full w-full overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[70vh]">
          {loading && <div className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-slate-500">Loading inventory...</div>}
          {error && <div className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-error">{error}</div>}
          <table className="w-full min-w-[800px] border-collapse lg:min-w-full">
            <thead className="sticky top-0 bg-surface-container-low z-10">
              <tr className="text-left text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">
                <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer" onClick={() => toggleSort('code')}>Code</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 cursor-pointer" onClick={() => toggleSort('name')}>Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right cursor-pointer hidden sm:table-cell" onClick={() => toggleSort('weight')}>Weight</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right cursor-pointer" onClick={() => toggleSort('price')}>Price</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center cursor-pointer" onClick={() => toggleSort('quantity')}>Qty</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const active = item.code === selectedItem?.code;
                return (
                  <tr key={item.code} onClick={() => setSelectedCode(item.code)} className={`cursor-pointer border-b border-outline-variant/10 transition-colors ${active ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                    <td className="px-3 sm:px-6 py-3 sm:py-5 font-mono font-bold text-primary text-xs sm:text-base">{item.code}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-5">
                      <div className="font-bold text-on-surface text-xs sm:text-base">{item.name}</div>
                      <div className="text-[9px] sm:text-xs text-outline mt-0.5 sm:mt-1 truncate">{item.description}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-5 text-right text-slate-600 hidden sm:table-cell text-xs sm:text-base">{item.weight}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-5 text-right font-bold text-xs sm:text-base">{formatINR(item.price)}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-5 text-center font-bold text-xs sm:text-base">{item.quantity}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                      <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.18em] ${statusTone[item.status] || 'bg-surface-container-high text-slate-700'}`}>
                        <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-current"></span>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-4 sm:space-y-6">
        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 lg:p-7 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Selected product</p>
              <h3 className="text-2xl sm:text-3xl font-black text-on-surface mt-2 truncate">{selectedItem?.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2">{selectedItem?.description}</p>
            </div>
            <button className="rounded-2xl bg-surface-container-low p-2 sm:p-3 text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">edit</span>
            </button>
          </div>

          {selectedItem && (
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-outline font-black">Weight</p>
                <p className="text-base sm:text-lg font-black text-on-surface mt-1 sm:mt-2">{selectedItem.weight}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-outline font-black">Quantity</p>
                <p className="text-base sm:text-lg font-black text-on-surface mt-1 sm:mt-2">{selectedItem.quantity}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-outline font-black">Price</p>
                <p className="text-base sm:text-lg font-black text-on-surface mt-1 sm:mt-2">{formatINR(selectedItem.price)}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-outline font-black">Last updated</p>
                <p className="text-base sm:text-lg font-black text-on-surface mt-1 sm:mt-2">{formatShortDateTime(selectedItem.lastUpdated)}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
            <button onClick={() => void updateQuantity(10, 'adjust')} className="w-full rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white sm:w-auto sm:px-4 sm:py-3 sm:text-sm">Adjust Stock (+10)</button>
            <button onClick={() => void updateQuantity(25, 'reorder')} className="w-full rounded-2xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface sm:w-auto sm:px-4 sm:py-3 sm:text-sm">Reorder (+25)</button>
            <button onClick={() => void updateQuantity(-5, 'dispatch')} className="w-full rounded-2xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface sm:w-auto sm:px-4 sm:py-3 sm:text-sm">Dispatch (-5)</button>
          </div>
          {feedback && <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-bold text-secondary">{feedback}</p>}
        </article>

        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Inventory insights</p>
          <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Stock threshold, price, and WIP updates</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed">Includes sortable columns and status filtering with highlighted selected row in master/detail layout.</p>
        </article>
      </aside>

      {filterModalOpen && (
        <div className="fixed inset-0 z-[96] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white border border-outline-variant/20 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xl sm:text-2xl font-black text-on-surface">Inventory Filters</h4>
              <button onClick={() => setFilterModalOpen(false)} className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-surface-container-low flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-4 sm:mt-6 space-y-4">
              <label className="block">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-outline font-black">Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold">
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 sm:mt-6 flex gap-2 justify-end">
              <button onClick={() => { setStatusFilter('All'); setFilterModalOpen(false); }} className="px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-surface-container-low text-xs sm:text-sm font-bold">Reset</button>
              <button onClick={() => setFilterModalOpen(false)} className="px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

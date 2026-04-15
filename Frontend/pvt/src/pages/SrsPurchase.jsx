import { useEffect, useMemo, useState } from 'react';
import { formatINR, formatShortDateTime } from '../lib/formatters';
import {
  advancePurchaseOrderStage,
  completePurchaseOrder,
  getPurchaseOrderLines,
  getPurchaseOrders,
  lookupEntity,
  updatePurchaseOrderLines,
} from '../lib/api';
import { createPollingFallback, initSocket, onOrderStatusChanged, onOrderUpdate, onSocketConnectionChange } from '../lib/socket';

function createRow() {
  return {
    code: '',
    name: '',
    qty: 1,
    price: 0,
  };
}

const purchaseSteps = ['Created', 'Approved', 'Ordered', 'Received', 'Completed'];
const purchaseStageIndex = {
  Created: 0,
  'Quotation Received': 0,
  Approved: 1,
  Ordered: 2,
  Unpaid: 2,
  Paid: 3,
  Received: 3,
  Completed: 4,
};

export default function SrsPurchase() {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rows, setRows] = useState([]);
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('Supplier Lookup');
  const [sortBy, setSortBy] = useState('updated-desc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getPurchaseOrders({ page: 1, pageSize: 200 });
        if (!active) {
          return;
        }
        setOrders(response.rows);
        if (response.rows[0]) {
          setSelectedOrderId(response.rows[0].id);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load purchase queue');
        }
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

    const unsubscribeOrderUpdate = onOrderUpdate((payload) => {
      if (!active || payload.type !== 'PURCHASE') {
        return;
      }
      void load();
    });

    const unsubscribeStatusChanged = onOrderStatusChanged((payload) => {
      if (!active || payload.type !== 'PURCHASE') {
        return;
      }
      setFeedback(`Order ${payload.orderId}: ${payload.fromStatus} → ${payload.toStatus}`);
    });
    
    return () => {
      active = false;
      fallback.stop();
      unsubscribeConnection();
      unsubscribeOrderUpdate();
      unsubscribeStatusChanged();
    };
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setRows([]);
      return;
    }

    let active = true;
    const loadLines = async () => {
      setError('');
      try {
        const lines = await getPurchaseOrderLines(selectedOrderId);
        if (!active) {
          return;
        }
        setRows(
          lines.lines.map((line) => ({
            code: line.code,
            name: line.code,
            qty: line.quantity,
            price: line.unitPrice,
          }))
        );
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load purchase lines');
        }
      }
    };

    void loadLines();
    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;
  const activeStageIndex = selectedOrder ? purchaseStageIndex[selectedOrder.status] ?? 0 : -1;

  useEffect(() => {
    const nextCode = selectedOrder?.supplierId ?? '';
    setSupplierCode(nextCode);
    setSupplierName(selectedOrder?.supplier ?? 'Supplier Lookup');
  }, [selectedOrder?.supplierId, selectedOrder?.supplier]);

  useEffect(() => {
    if (!supplierCode) {
      setSupplierName('Supplier Lookup');
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const entity = await lookupEntity(supplierCode);
        if (active) {
          setSupplierName(entity.name || entity.id || 'Supplier Lookup');
        }
      } catch (_error) {
        if (active) {
          setSupplierName(selectedOrder?.supplier ?? 'Supplier Lookup');
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [supplierCode, selectedOrder?.supplier]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = orders.filter((order) =>
      [order.id, order.supplier, order.supplierId, order.stage, order.status].some((value) =>
        String(value ?? '').toLowerCase().includes(normalized)
      )
    );
    return [...matched].sort((a, b) => {
      if (sortBy === 'updated-asc') return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      if (sortBy === 'updated-desc') return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.status.localeCompare(b.status);
    });
  }, [orders, query, sortBy]);

  const total = rows.reduce((sum, row) => sum + row.qty * row.price, 0);

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: field === 'qty' || field === 'price' ? Number(value) : value } : row
      )
    );
  };

  const handleComplete = async () => {
    if (!selectedOrder) {
      return;
    }

    const cleanedRows = rows
      .filter((row) => row.code.trim().length > 0)
      .map((row) => ({
        code: row.code.trim(),
        quantity: Math.max(1, Number(row.qty) || 1),
        unitPrice: Math.max(0, Number(row.price) || 0),
      }));

    if (!cleanedRows.length) {
      setError('Add at least one valid line item before completion.');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    try {
      await updatePurchaseOrderLines(selectedOrder.id, {
        lines: cleanedRows,
        note: `Updated via UI at ${new Date().toISOString()}`,
      });
      const completed = await completePurchaseOrder(selectedOrder.id);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === completed.id ? { ...order, ...completed } : order))
      );
      setFeedback('Purchase completed successfully.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete purchase order');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedOrder) {
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const updated = await advancePurchaseOrderStage(selectedOrder.id, selectedOrder.status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === selectedOrder.id ? { ...order, ...updated } : order))
      );
      const statusMap = {
        Created: 'Approved',
        Approved: 'Ordered',
        Ordered: 'Received',
        Received: 'Completed',
        Unpaid: 'Paid',
        Paid: 'Completed',
      };
      setFeedback(`Order advanced to ${statusMap[selectedOrder.status] || updated.status}`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to advance order stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
        <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Purchase workflow</p>
            <h3 className="text-xl sm:text-2xl font-black text-on-surface mt-2">Quotations received, paid/unpaid, completion, and history</h3>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2 xl:justify-end">
            {purchaseSteps.map((step, index) => (
              <span key={step} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] ${activeStageIndex >= index ? 'bg-primary text-white' : 'bg-surface-container-low text-slate-500'}`}>
                {step}
              </span>
            ))}
          </div>
        </div>
      </section>

      {loading && <section className="rounded-[1.5rem] sm:rounded-2xl bg-surface-container-low p-3 sm:p-4 text-xs sm:text-sm font-bold text-slate-600">Loading purchase data...</section>}
      {error && <section className="rounded-[1.5rem] sm:rounded-2xl bg-error/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-error">{error}</section>}
      {feedback && <section className="rounded-[1.5rem] sm:rounded-2xl bg-secondary/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-secondary">{feedback}</section>}

      <section className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-outline-variant/10 flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Purchase queue</p>
              <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Supplier orders</h3>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto xl:flex-row xl:items-center">
              <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-surface-container-low px-3 py-2 sm:px-4 sm:py-3 xl:w-60">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-transparent outline-none border-none text-xs sm:text-sm w-full" placeholder="Search orders" />
              </div>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full rounded-2xl border-none bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface sm:px-4 sm:py-3 sm:text-sm xl:w-auto">
                <option value="updated-desc">Newest</option>
                <option value="updated-asc">Oldest</option>
                <option value="amount-desc">High-Low</option>
                <option value="amount-asc">Low-High</option>
                <option value="status">Status A-Z</option>
              </select>
            </div>
          </div>
          <div className="h-full max-h-[50vh] overflow-y-auto sm:max-h-[70vh]">
            {filteredOrders.map((order) => {
              const selected = order.id === selectedOrderId;
              return (
                <button key={order.id} onClick={() => setSelectedOrderId(order.id)} className={`w-full text-left p-3 sm:p-5 border-b border-outline-variant/10 transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">{order.id}</p>
                      <h4 className="mt-1 sm:mt-2 font-black text-on-surface text-sm sm:text-base truncate">{order.supplier}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">ID {order.supplierId}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] ${order.status === 'Approved' ? 'bg-secondary/10 text-secondary' : order.status === 'Dispatched' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                        {order.status}
                      </span>
                      <p className="font-black text-on-surface mt-2 text-sm sm:text-base">{formatINR(order.amount)}</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-outline">
                    <span>{order.stage}</span>
                    <span>{formatShortDateTime(order.updated)}</span>
                  </div>
                </button>
              );
            })}
            {!loading && !filteredOrders.length && <p className="p-4 sm:p-5 text-xs sm:text-sm text-slate-500">No purchase orders found.</p>}
          </div>
        </article>

        <article className="space-y-4 sm:space-y-6">
          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Selected order</p>
                <h3 className="text-2xl sm:text-3xl font-black text-on-surface mt-2 truncate">{selectedOrder?.supplier ?? 'No order selected'}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">Supplier autofill and procurement lifecycle.</p>
              </div>
              <div className="rounded-2xl bg-primary/10 text-primary px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black whitespace-nowrap">{selectedOrder?.stage ?? '-'}</div>
            </div>

            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">Supplier autofill</p>
                <input value={supplierCode} onChange={(event) => setSupplierCode(event.target.value)} className="mt-2 w-full rounded-xl border-none bg-white px-3 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm" placeholder="Enter supplier ID" />
                <p className="mt-2 text-xs sm:text-sm text-slate-500 truncate">Resolved: {supplierName}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">Payment state</p>
                <div className="mt-3 flex flex-wrap gap-1 sm:gap-2">
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-primary text-white text-[10px] sm:text-xs font-black">Quotation Received</span>
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-secondary text-white text-[10px] sm:text-xs font-black">Paid</span>
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-surface-container-high text-slate-500 text-[10px] sm:text-xs font-black">Unpaid</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Line items</p>
                <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Unlimited items per purchase order</h3>
              </div>
              <button onClick={() => setRows((currentRows) => [...currentRows, createRow()])} className="w-full rounded-2xl border border-dashed border-primary/30 px-3 py-2 text-xs font-black text-primary whitespace-nowrap sm:w-auto sm:px-4 sm:py-3 sm:text-sm">+ Add Product</button>
            </div>

            <div className="mt-4 w-full overflow-x-auto rounded-[1.5rem] border border-outline-variant/15 sm:mt-5">
              <table className="w-full min-w-[800px] border-collapse text-left lg:min-w-full">
                <thead className="bg-surface-container-low">
                  <tr className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">
                    <th className="px-3 sm:px-4 py-3 sm:py-4">Code</th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4">Product</th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-center">Qty</th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-right">Price</th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.code}-${index}`} className="border-t border-outline-variant/10">
                      <td className="px-3 sm:px-4 py-3 sm:py-4"><input value={row.code} onChange={(event) => updateRow(index, 'code', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono" /></td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4"><input value={row.name} onChange={(event) => updateRow(index, 'name', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold" /></td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4"><input type="number" value={row.qty} onChange={(event) => updateRow(index, 'qty', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-bold" /></td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4"><input type="number" value={row.price} onChange={(event) => updateRow(index, 'price', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-right font-bold" /></td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-black text-xs sm:text-sm">{formatINR(row.qty * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-[1fr_0.78fr]">
            <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Supplier details</p>
              <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Auto-filled details</h3>
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex justify-between gap-4"><span>Name</span><span className="font-bold text-on-surface text-right truncate">{supplierName}</span></div>
                <div className="flex justify-between gap-4"><span>Stage</span><span className="font-bold text-on-surface text-right">{selectedOrder?.stage ?? '-'}</span></div>
                <div className="flex justify-between gap-4"><span>Reference</span><span className="font-bold text-on-surface text-right font-mono text-[10px] sm:text-sm">{selectedOrder?.id ?? '-'}</span></div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-primary text-white p-4 sm:p-6 shadow-lg shadow-primary/15">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/70 font-black">Summary</p>
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/80">
                <div className="flex justify-between"><span>Order total</span><span className="font-black text-white">{formatINR(total)}</span></div>
                <div className="flex justify-between"><span>Payment</span><span className="font-black text-white">Paid / Unpaid</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2"><span>Final status</span><span className="font-black text-white">{selectedOrder?.status ?? '-'}</span></div>
              </div>
              <button onClick={() => void handleComplete()} disabled={saving || !selectedOrder} className="mt-4 sm:mt-5 w-full rounded-2xl bg-white text-primary px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black disabled:opacity-60">
                {saving ? 'Submitting...' : 'Complete Purchase'}
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}


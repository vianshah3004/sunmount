import { useEffect, useMemo, useState } from 'react';
import { formatINR, formatShortDateTime } from '../lib/formatters';
import FilterDropdown from '../components/FilterDropdown';
import {
  advanceOrderStage,
  finalizeSalesOrder,
  getOrderRuntimeStatus,
  getSalesOrderLines,
  getSalesOrders,
  lookupEntity,
  updateSalesOrderLines,
} from '../lib/api';
import { createPollingFallback, initSocket, onOrderStatusChanged, onOrderUpdate, onSocketConnectionChange } from '../lib/socket';

const stageSteps = ['Quotation', 'Confirmed', 'Packed', 'Dispatched', 'Delivered', 'Paid'];
const salesStageIndex = {
  Quotation: 0,
  Confirmed: 1,
  Packed: 2,
  Packing: 2,
  Dispatched: 3,
  Delivered: 4,
  Paid: 5,
  Completed: 5,
};

const ORDER_FILTER_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'status-approved', label: 'Status: Approved' },
  { value: 'status-pending', label: 'Status: Pending' },
];

function createRow() {
  return {
    code: '',
    name: '',
    qty: 1,
    price: 0,
  };
}

export default function SrsSales({ onOrderClick }) {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rows, setRows] = useState([]);
  const [entityCode, setEntityCode] = useState('');
  const [customerName, setCustomerName] = useState('Customer Lookup');
  const [orderFilter, setOrderFilter] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [runtimeStatus, setRuntimeStatus] = useState({
    state: 'checking',
    checkedAt: null,
  });

  useEffect(() => {
    let active = true;

    const checkRuntime = async () => {
      try {
        const result = await getOrderRuntimeStatus();
        if (!active) {
          return;
        }
        setRuntimeStatus({
          state: result.running ? 'running' : 'down',
          checkedAt: result.timestamp,
        });
      } catch (_error) {
        if (active) {
          setRuntimeStatus({
            state: 'down',
            checkedAt: null,
          });
        }
      }
    };

    void checkRuntime();
    const intervalId = window.setInterval(() => {
      void checkRuntime();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getSalesOrders({ page: 1, pageSize: 200 });
        if (!active) {
          return;
        }
        setOrders(response.rows);
        if (response.rows[0]) {
          setSelectedOrderId(response.rows[0].id);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load sales queue');
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
      if (!active || payload.type !== 'SALE') {
        return;
      }
      void load();
    });

    const unsubscribeStatusChanged = onOrderStatusChanged((payload) => {
      if (!active || payload.type !== 'SALE') {
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
        const lines = await getSalesOrderLines(selectedOrderId);
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
          setError(requestError.message || 'Unable to load order lines');
        }
      }
    };

    void loadLines();
    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;
  const activeStageIndex = selectedOrder ? salesStageIndex[selectedOrder.status] ?? 0 : -1;

  useEffect(() => {
    const nextCode = selectedOrder?.customerId ?? '';
    setEntityCode(nextCode);
    setCustomerName(selectedOrder?.customer ?? 'Customer Lookup');
  }, [selectedOrder?.customerId, selectedOrder?.customer]);

  useEffect(() => {
    if (!entityCode) {
      setCustomerName('Customer Lookup');
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const entity = await lookupEntity(entityCode);
        if (active) {
          setCustomerName(entity.name || entity.id || 'Customer Lookup');
        }
      } catch (_error) {
        if (active) {
          setCustomerName(selectedOrder?.customer ?? 'Customer Lookup');
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [entityCode, selectedOrder?.customer]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = orders.filter((order) =>
      [order.id, order.customer, order.customerId, order.stage, order.status].some((value) =>
        String(value ?? '').toLowerCase().includes(normalized)
      )
    );

    const getOrderTime = (order) => {
      const source = order.createdAt ?? order.created ?? order.updated;
      const timestamp = new Date(source ?? 0).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    if (orderFilter === 'status-approved') {
      return matched.filter((order) => String(order.status ?? '').toLowerCase() === 'approved');
    }

    if (orderFilter === 'status-pending') {
      return matched.filter((order) => String(order.status ?? '').toLowerCase() === 'pending');
    }

    return [...matched].sort((a, b) => {
      if (orderFilter === 'oldest') {
        return getOrderTime(a) - getOrderTime(b);
      }
      if (orderFilter === 'price-low-high') {
        return Number(a.amount ?? 0) - Number(b.amount ?? 0);
      }
      if (orderFilter === 'price-high-low') {
        return Number(b.amount ?? 0) - Number(a.amount ?? 0);
      }
      return getOrderTime(b) - getOrderTime(a);
    });
  }, [orders, query, orderFilter]);

  const subtotal = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: field === 'qty' || field === 'price' ? Number(value) : value } : row
      )
    );
  };

  const handleFinalizeDispatch = async () => {
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
      setError('Add at least one valid line item before finalizing.');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    try {
      await updateSalesOrderLines(selectedOrder.id, {
        lines: cleanedRows,
        note: `Updated via UI at ${new Date().toISOString()}`,
      });
      const finalized = await finalizeSalesOrder(selectedOrder.id);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === finalized.id ? { ...order, ...finalized } : order))
      );
      setFeedback('Order finalized and dispatched.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to finalize order');
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
      const updated = await advanceOrderStage(selectedOrder.id, selectedOrder.status);
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === selectedOrder.id ? { ...order, ...updated } : order))
      );
      const statusMap = {
        Quotation: 'Confirmed',
        Confirmed: 'Packed',
        Packed: 'Dispatched',
        Dispatched: 'Delivered',
        Delivered: 'Paid',
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
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Sales workflow</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-on-surface mt-2">Quotation to packing to dispatch</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                  runtimeStatus.state === 'running'
                    ? 'bg-secondary/15 text-secondary'
                    : runtimeStatus.state === 'checking'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-error/10 text-error'
                }`}
              >
                Order Engine {runtimeStatus.state === 'running' ? 'Running' : runtimeStatus.state === 'checking' ? 'Checking' : 'Offline'}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Check point: {runtimeStatus.checkedAt ? formatShortDateTime(runtimeStatus.checkedAt) : 'No health signal yet'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2 xl:justify-end">
            {stageSteps.map((step, index) => {
              const isActive = activeStageIndex >= index;
              return (
                <span key={step} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] ${isActive ? 'bg-primary text-white' : 'bg-surface-container-low text-slate-500'}`}>
                  {step}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {loading && <section className="rounded-[1.5rem] sm:rounded-2xl bg-surface-container-low p-3 sm:p-4 text-xs sm:text-sm font-bold text-slate-600">Loading sales data...</section>}
      {error && <section className="rounded-[1.5rem] sm:rounded-2xl bg-error/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-error">{error}</section>}
      {feedback && <section className="rounded-[1.5rem] sm:rounded-2xl bg-secondary/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-secondary">{feedback}</section>}

      <section className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <article className="min-w-0 rounded-[2rem] bg-white/90 border border-outline-variant/20 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-outline-variant/10 flex flex-col gap-3 sm:gap-4 wide:flex-row wide:items-center wide:justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Sales queue</p>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-on-surface mt-2">Orders and quotations</h3>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto wide:flex-row wide:items-center">
              <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-surface-container-low px-3 py-2 sm:px-4 sm:py-3 wide:w-64">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-transparent outline-none border-none text-xs sm:text-sm w-full" placeholder="Search orders" />
              </div>
              <FilterDropdown
                options={ORDER_FILTER_OPTIONS}
                value={orderFilter}
                onChange={setOrderFilter}
                className="wide:w-auto"
              />
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
                      <h4 className="mt-1 sm:mt-2 font-black text-on-surface text-sm sm:text-base truncate">{order.customer}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">ID {order.customerId}</p>
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
            {!loading && !filteredOrders.length && <p className="p-4 sm:p-5 text-xs sm:text-sm text-slate-500">No orders found.</p>}
          </div>
        </article>

        <article className="min-w-0 space-y-4 sm:space-y-6">
          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Active order</p>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-surface mt-2 truncate">{selectedOrder?.customer ?? 'No order selected'}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">Quotation, packing, dispatch, and history status flow.</p>
              </div>
              <button onClick={onOrderClick} className="w-full xl:w-auto shrink-0 rounded-2xl bg-primary px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-150 hover:opacity-90">Open details</button>
            </div>

            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">Customer autofill</p>
                <input value={entityCode} onChange={(event) => setEntityCode(event.target.value)} className="mt-2 w-full rounded-xl border-none bg-white px-3 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm" placeholder="Enter customer ID" />
                <p className="mt-2 text-xs sm:text-sm text-slate-500 truncate">Resolved: {customerName}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-outline font-black">Status path</p>
                <div className="mt-3 flex flex-wrap gap-1 sm:gap-2">
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-primary text-white text-[10px] sm:text-xs font-black">Quotation</span>
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-secondary text-white text-[10px] sm:text-xs font-black">Packing</span>
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-surface-container-high text-slate-500 text-[10px] sm:text-xs font-black">Dispatch</span>
                  <span className="px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-surface-container-high text-slate-500 text-[10px] sm:text-xs font-black">History</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Line items</p>
                <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Unlimited products per order</h3>
              </div>
                <button onClick={() => setRows((currentRows) => [...currentRows, createRow()])} className="w-full md:w-auto rounded-2xl border border-dashed border-primary/30 px-3 sm:px-4 py-2 sm:py-3 text-primary text-xs sm:text-sm font-black whitespace-nowrap transition-colors duration-150 hover:bg-primary/5">+ Add Product</button>
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
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input value={row.code} onChange={(event) => updateRow(index, 'code', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input value={row.name} onChange={(event) => updateRow(index, 'name', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input type="number" value={row.qty} onChange={(event) => updateRow(index, 'qty', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-bold" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input type="number" value={row.price} onChange={(event) => updateRow(index, 'price', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-right font-bold" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-black text-xs sm:text-sm">{formatINR(row.qty * row.price)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-xs sm:text-sm text-slate-500">No line items yet. Add a product to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1fr_0.78fr]">
            <div className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Customer details</p>
              <h3 className="text-lg sm:text-xl font-black text-on-surface mt-2">Auto-filled details</h3>
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex justify-between gap-4"><span>Name</span><span className="font-bold text-on-surface text-right break-words max-w-[60%]">{customerName}</span></div>
                <div className="flex justify-between gap-4"><span>Stage</span><span className="font-bold text-on-surface text-right">{selectedOrder?.stage ?? '-'}</span></div>
                <div className="flex justify-between gap-4"><span>Reference</span><span className="font-bold text-on-surface text-right font-mono text-[10px] sm:text-sm">{selectedOrder?.id ?? '-'}</span></div>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/10">
                <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black mb-4">Stage progression</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder && selectedOrder.status === 'QUOTATION' && (
                    <button onClick={() => void handleAdvanceStage()} disabled={saving} className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto sm:text-sm">
                      Move to Packing
                    </button>
                  )}
                  {selectedOrder && selectedOrder.status === 'PACKING' && (
                    <button onClick={() => void handleAdvanceStage()} disabled={saving} className="w-full rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto sm:text-sm">
                      Move to Dispatch
                    </button>
                  )}
                  {selectedOrder && selectedOrder.status === 'DISPATCHED' && (
                    <button onClick={() => void handleAdvanceStage()} disabled={saving} className="w-full rounded-xl bg-tertiary px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto sm:text-sm">
                      Move to History
                    </button>
                  )}
                  {selectedOrder && ['QUOTATION', 'PACKING'].includes(selectedOrder.status) && (
                    <button onClick={() => void handleFinalizeDispatch()} disabled={saving || !selectedOrder || !rows.length} className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60 sm:w-auto sm:text-sm">
                      Skip to Dispatch
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-primary text-white p-4 sm:p-6 shadow-lg shadow-primary/15">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/70 font-black">Summary</p>
              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/80">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-black text-white">{formatINR(subtotal)}</span></div>
                <div className="flex justify-between"><span>GST 18%</span><span className="font-black text-white">{formatINR(tax)}</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2"><span>Total</span><span className="font-black text-white">{formatINR(total)}</span></div>
              </div>
              <button onClick={() => void handleFinalizeDispatch()} disabled={saving || !selectedOrder} className="mt-4 sm:mt-5 w-full rounded-2xl bg-white text-primary px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60">
                {saving ? 'Submitting...' : 'Finalize & Dispatch'}
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

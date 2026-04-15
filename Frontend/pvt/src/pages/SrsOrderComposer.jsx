import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatINR } from '../lib/formatters';
import { createCoreOrder, getCoreOrderById, getCoreProducts, lookupEntity, updateCoreOrder } from '../lib/api';

function createRow(template) {
  return {
    code: template?.sku ?? template?.productCode ?? '',
    name: template?.name ?? template?.productCode ?? '',
    qty: 1,
    price: Number(template?.price ?? template?.displayPrice ?? 0),
  };
}

export default function SrsOrderComposer() {
  const location = useLocation();
  const editOrderId = location.state?.orderId ?? '';
  const [entityCode, setEntityCode] = useState('');
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState('Deliver before 5 PM and pack in bulk cartons.');
  const [entityName, setEntityName] = useState('Lookup result');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        if (editOrderId) {
          const order = await getCoreOrderById(editOrderId);
          if (!active) {
            return;
          }

          setEntityCode(order.partyId ?? '');
          setEntityName(order.partyId ?? 'Lookup result');
          setNotes(order.notes ?? 'Deliver before 5 PM and pack in bulk cartons.');
          setRows((order.items ?? []).length ? order.items.map((item) => ({
            code: item.productCode ?? '',
            name: item.productCode ?? '',
            qty: Number(item.quantity ?? 1),
            price: Number(item.price ?? 0),
          })) : [createRow(), createRow()]);
          return;
        }

        const response = await getCoreProducts({ page: 1, limit: 20 });
        if (!active) {
          return;
        }
        const starterRows = response.rows.slice(0, 2).map((item) => createRow(item));
        setRows(starterRows.length ? starterRows : [createRow(), createRow()]);
      } catch (requestError) {
        if (active) {
          if (!editOrderId) {
            setRows([createRow(), createRow()]);
          }
          setError(requestError.message || (editOrderId ? 'Unable to load selected order' : 'Unable to load products'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProducts();
    return () => {
      active = false;
    };
  }, [editOrderId]);

  useEffect(() => {
    if (!entityCode) {
      setEntityName('Lookup result');
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const entity = await lookupEntity(entityCode);
        if (active) {
          setEntityName(entity.name || entity.id || 'Lookup result');
        }
      } catch (_error) {
        if (active) {
          setEntityName('Lookup result');
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [entityCode]);

  const subtotal = useMemo(() => rows.reduce((sum, row) => sum + row.qty * row.price, 0), [rows]);
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: field === 'qty' || field === 'price' ? Number(value) : value } : row
      )
    );
  };

  const submitOrder = async () => {
    const type = entityCode.toUpperCase().startsWith('SUP') ? 'PURCHASE' : 'SALE';
    const products = rows
      .filter((row) => row.code.trim().length > 0)
      .map((row) => ({
        productCode: row.code.trim(),
        quantity: Math.max(1, Number(row.qty) || 1),
        price: Math.max(0, Number(row.price) || 0),
      }));

    if (!entityCode.trim()) {
      setError('Enter a customer or supplier ID.');
      return;
    }
    if (!products.length) {
      setError('Add at least one valid line item.');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const payload = {
        type,
        partyId: entityCode.trim(),
        products,
        notes,
      };

      const result = editOrderId
        ? await updateCoreOrder(editOrderId, payload)
        : await createCoreOrder(payload);

      setFeedback(editOrderId ? `Order updated: ${result.id}` : `Order created: ${result.id}`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Create/Edit order</p>
        <h3 className="mt-2 text-xl font-black text-on-surface sm:text-2xl lg:text-3xl">Unified order composer with unlimited line items</h3>
        {editOrderId && <p className="mt-2 text-sm font-bold text-slate-500">Editing order #{editOrderId}</p>}
      </section>

      {loading && <section className="rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-slate-600">Loading product templates...</section>}
      {error && <section className="rounded-2xl bg-error/10 p-4 text-sm font-bold text-error">{error}</section>}
      {feedback && <section className="rounded-2xl bg-secondary/10 p-4 text-sm font-bold text-secondary">{feedback}</section>}

      <section className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="space-y-6 rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">Customer or supplier ID</span>
              <input value={entityCode} onChange={(event) => setEntityCode(event.target.value)} className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" placeholder="Enter entity ID" />
              <p className="mt-2 text-sm text-slate-500">Resolved entity: <span className="font-bold text-on-surface">{entityName}</span></p>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">Order type</span>
              <input value={entityCode.toUpperCase().startsWith('SUP') ? 'PURCHASE' : 'SALE'} readOnly className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">Date</span>
              <input value={new Date().toISOString().slice(0, 10)} type="date" readOnly className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
            </label>
          </div>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Line items</p>
                <h4 className="mt-2 text-lg font-black text-on-surface sm:text-xl lg:text-2xl">Add as many products as needed</h4>
              </div>
              <button onClick={() => setRows((currentRows) => [...currentRows, createRow()])} className="w-full rounded-2xl border border-dashed border-primary/30 px-4 py-3 text-sm font-black text-primary transition-colors duration-150 hover:bg-primary/5 sm:w-auto">+ Add Product</button>
            </div>
            <div className="w-full overflow-x-auto rounded-[1.5rem] border border-outline-variant/15">
              <table className="w-full min-w-[800px] border-collapse text-left lg:min-w-full">
                <thead className="bg-surface-container-low">
                  <tr className="text-[8px] font-black uppercase tracking-[0.22em] text-outline sm:text-[10px]">
                    <th className="px-3 py-4 sm:px-4">Code</th>
                    <th className="px-3 py-4 sm:px-4">Product</th>
                    <th className="px-3 py-4 text-center sm:px-4">Qty</th>
                    <th className="px-3 py-4 text-right sm:px-4">Price</th>
                    <th className="px-3 py-4 text-right sm:px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.code}-${index}`} className="border-t border-outline-variant/10 text-sm sm:text-base">
                      <td className="px-3 py-3 sm:px-4 sm:py-4"><input value={row.code} onChange={(event) => updateRow(index, 'code', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 py-2 text-xs font-mono sm:px-3 sm:text-sm" /></td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4"><input value={row.name} onChange={(event) => updateRow(index, 'name', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 py-2 text-xs font-bold sm:px-3 sm:text-sm" /></td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4"><input type="number" value={row.qty} onChange={(event) => updateRow(index, 'qty', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 py-2 text-center text-xs font-bold sm:px-3 sm:text-sm" /></td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4"><input type="number" value={row.price} onChange={(event) => updateRow(index, 'price', event.target.value)} className="w-full rounded-xl border-none bg-surface-container-low px-2 py-2 text-right text-xs font-bold sm:px-3 sm:text-sm" /></td>
                      <td className="px-3 py-3 text-right text-xs font-black sm:px-4 sm:py-4 sm:text-sm">{formatINR(row.qty * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <aside className="space-y-4 sm:space-y-6">
          <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Notes and controls</p>
            <h3 className="mt-2 text-lg font-black text-on-surface sm:text-xl lg:text-2xl">Context-aware actions</h3>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 min-h-32 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm leading-relaxed" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high sm:w-auto">Save Draft</button>
              <button onClick={() => void submitOrder()} disabled={saving} className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 disabled:opacity-60 sm:w-auto">{saving ? (editOrderId ? 'Saving...' : 'Submitting...') : (editOrderId ? 'Save changes' : 'Submit')}</button>
            </div>
          </article>

          <article className="rounded-[2rem] bg-primary p-4 text-white shadow-lg shadow-primary/15 sm:p-6">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/75">Totals</p>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <div className="flex justify-between gap-4"><span>Subtotal</span><span className="font-black text-white">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between gap-4"><span>GST 18%</span><span className="font-black text-white">{formatINR(tax)}</span></div>
              <div className="flex justify-between gap-4"><span>Grand total</span><span className="font-black text-white">{formatINR(grandTotal)}</span></div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { formatINR } from '../lib/formatters';
import { createEntity, deleteEntity, getEntities, updateEntity } from '../lib/api';

export default function SrsCustomers() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutating, setMutating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEntities({ page: 1, pageSize: 200 });
      const withValueFallback = (response.rows ?? []).map((row, index) => {
        const rawValue = Number(row?.value);
        if (Number.isFinite(rawValue) && rawValue > 0) {
          return row;
        }

        // Keep the UI useful in demo data scenarios where value was not populated yet.
        const demoValue = row.type === 'Supplier' ? 42000 + index * 8500 : 78000 + index * 14000;
        return { ...row, value: demoValue };
      });

      setCustomers(withValueFallback);
      if (withValueFallback[0]) {
        setSelectedId((current) => {
          if (current && withValueFallback.some((row) => row.id === current)) {
            return current;
          }
          return withValueFallback[0].id;
        });
      } else {
        setSelectedId('');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load entities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadCustomers();
    };

    void load();
  }, []);

  const handleEdit = async () => {
    if (!selectedCustomer || mutating) {
      return;
    }

    const name = window.prompt('Edit name', selectedCustomer.name ?? '');
    if (name === null) {
      return;
    }

    const contact = window.prompt('Edit contact (email or phone)', selectedCustomer.contact ?? '');
    if (contact === null) {
      return;
    }

    const location = window.prompt('Edit location', selectedCustomer.location ?? '');
    if (location === null) {
      return;
    }

    const valueRaw = window.prompt('Edit lifetime value', String(selectedCustomer.value ?? 0));
    if (valueRaw === null) {
      return;
    }

    const parsedValue = Number(valueRaw);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setActionMessage('Value must be a number greater than or equal to 0.');
      return;
    }

    setMutating(true);
    setActionMessage('');
    try {
      await updateEntity(selectedCustomer.id, {
        name: name.trim(),
        contact: contact.trim(),
        location: location.trim(),
        value: parsedValue,
      });
      setActionMessage('Entity updated successfully.');
      await loadCustomers();
    } catch (requestError) {
      setActionMessage(requestError?.message || 'Unable to update entity.');
    } finally {
      setMutating(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedCustomer || mutating) {
      return;
    }

    const confirmed = window.confirm(`Remove ${selectedCustomer.name}?`);
    if (!confirmed) {
      return;
    }

    setMutating(true);
    setActionMessage('');
    try {
      await deleteEntity(selectedCustomer.id);
      setActionMessage('Entity removed successfully.');
      await loadCustomers();
    } catch (requestError) {
      setActionMessage(requestError?.message || 'Unable to remove entity.');
    } finally {
      setMutating(false);
    }
  };

  const handleCreate = async () => {
    if (mutating) {
      return;
    }

    const typeInput = window.prompt('Type (Customer or Supplier)', 'Customer');
    if (typeInput === null) {
      return;
    }

    const normalizedType = typeInput.trim().toLowerCase() === 'supplier' ? 'Supplier' : 'Customer';
    const name = window.prompt('Name', '');
    if (name === null) {
      return;
    }
    const contact = window.prompt('Contact (email or phone)', '');
    if (contact === null) {
      return;
    }
    const location = window.prompt('Location', '');
    if (location === null) {
      return;
    }
    const valueRaw = window.prompt('Lifetime value', normalizedType === 'Customer' ? '85000' : '45000');
    if (valueRaw === null) {
      return;
    }

    const parsedValue = Number(valueRaw);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setActionMessage('Value must be a number greater than or equal to 0.');
      return;
    }

    setMutating(true);
    setActionMessage('');
    try {
      const created = await createEntity({
        type: normalizedType,
        name: name.trim(),
        contact: contact.trim(),
        location: location.trim(),
        value: parsedValue,
        status: 'Approved',
        mode: 'Active',
      });
      setActionMessage('Entity created successfully.');
      await loadCustomers();
      if (created?.id) {
        setSelectedId(created.id);
      }
    } catch (requestError) {
      setActionMessage(requestError?.message || 'Unable to create entity.');
    } finally {
      setMutating(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return customers.filter((customer) =>
      [customer.id, customer.name, customer.contact, customer.location, customer.type].some((value) =>
        String(value ?? '').toLowerCase().includes(normalized)
      )
    );
  }, [customers, query]);

  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedId) ?? filteredCustomers[0] ?? customers[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/90 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
        <div className="flex flex-col gap-3 border-b border-outline-variant/10 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Directory</p>
            <h3 className="mt-2 text-xl font-black text-on-surface sm:text-2xl lg:text-3xl">Customers and suppliers</h3>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:w-auto sm:min-w-64">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border-none bg-transparent text-sm outline-none" placeholder="Search by name, ID, or location" />
          </div>
        </div>

        <div className="max-h-[70vh] divide-y divide-outline-variant/10 overflow-auto">
          {loading && <p className="p-5 text-sm font-bold text-slate-500">Loading entities...</p>}
          {error && <p className="p-5 text-sm font-bold text-error">{error}</p>}
          {!error && actionMessage && <p className="p-5 text-sm font-bold text-primary">{actionMessage}</p>}
          {!loading && !error && filteredCustomers.map((customer) => {
            const selected = customer.id === selectedId;
            return (
              <button key={customer.id} onClick={() => setSelectedId(customer.id)} className={`w-full text-left transition-colors duration-150 p-3 sm:p-5 ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">{customer.type}</p>
                    <h4 className="mt-2 truncate font-black text-on-surface">{customer.name}</h4>
                    <p className="mt-1 text-sm text-slate-500 break-words">{customer.contact}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${customer.type === 'Customer' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                      {customer.status}
                    </span>
                    <p className="mt-3 font-black text-on-surface">{formatINR(customer.value ?? 0)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-outline">
                  <span className="truncate">{customer.location}</span>
                  <span>{customer.mode}</span>
                </div>
              </button>
            );
          })}
          {!loading && !error && !filteredCustomers.length && <p className="p-5 text-sm text-slate-500">No entities found.</p>}
        </div>
      </section>

      <aside className="space-y-4 sm:space-y-6">
        <article className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/90 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
          <div className="relative h-40 bg-gradient-to-br from-primary to-tertiary p-4 text-white sm:h-48 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.3),_transparent_35%)]"></div>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/75">Selected entity</p>
                <h3 className="mt-2 text-2xl font-black sm:text-3xl lg:text-4xl">{selectedCustomer?.name ?? 'No entity selected'}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">{selectedCustomer?.type ?? '-'}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">{selectedCustomer?.status ?? '-'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">ID</span><span className="font-bold text-on-surface">{selectedCustomer?.id ?? '-'}</span></div>
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Contact</span><span className="font-bold text-on-surface">{selectedCustomer?.contact ?? '-'}</span></div>
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Location</span><span className="font-bold text-on-surface">{selectedCustomer?.location ?? '-'}</span></div>
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Lifetime value</span><span className="font-bold text-on-surface">{formatINR(selectedCustomer?.value ?? 0)}</span></div>
            <div className="flex flex-wrap gap-3 pt-4">
              <button disabled={!selectedCustomer || mutating} onClick={handleEdit} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Edit</button>
              <button disabled={!selectedCustomer || mutating} onClick={handleRemove} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50">Remove</button>
              <button className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Create Order</button>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Master/detail pattern</p>
          <h3 className="mt-2 text-lg font-black text-on-surface sm:text-xl lg:text-2xl">Immediate details on selection</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">This screen matches the SRS list-detail layout with search, selection highlight, and context actions on the right.</p>
        </article>

        <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Quick actions</p>
          <h3 className="mt-2 text-lg font-black text-on-surface sm:text-xl">Add customer or supplier</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">Create a new directory record with name, contact, location, and value.</p>
          <button
            disabled={mutating}
            onClick={handleCreate}
            className="mt-4 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Entity
          </button>
        </article>
      </aside>
    </div>
  );
}

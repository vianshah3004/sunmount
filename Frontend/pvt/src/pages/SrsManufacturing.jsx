import { useEffect, useMemo, useState } from 'react';
import { formatShortDateTime } from '../lib/formatters';
import {
  completeManufacturingBatch,
  deleteManufacturingBatch,
  getManufacturingBatches,
  startManufacturingBatch,
  updateManufacturingBatch,
} from '../lib/api';
import { createPollingFallback, initSocket, onManufacturingUpdate, onSocketConnectionChange } from '../lib/socket';

const sortByOptions = [
  { value: 'updated-desc', label: 'Last Updated (Newest)' },
  { value: 'updated-asc', label: 'Last Updated (Oldest)' },
  { value: 'progress-desc', label: 'Progress (High-Low)' },
  { value: 'progress-asc', label: 'Progress (Low-High)' },
];

export default function SrsManufacturing() {
  const [batches, setBatches] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updated-desc');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editOutput, setEditOutput] = useState('');
  const [editEta, setEditEta] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getManufacturingBatches({ page: 1, pageSize: 200 });
        if (!active) {
          return;
        }
        setBatches(response.rows);
        if (response.rows[0]) {
          setSelectedBatchId(response.rows[0].id);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load manufacturing batches');
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

    const unsubscribeManufacturingUpdate = onManufacturingUpdate((payload) => {
      if (!active) {
        return;
      }
      void load();
      setFeedback(`Batch ${payload.batchNumber}: status updated to ${payload.status}`);
    });
    
    return () => {
      active = false;
      fallback.stop();
      unsubscribeConnection();
      unsubscribeManufacturingUpdate();
    };
  }, []);

  const filteredBatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = batches
      .filter((batch) => (statusFilter === 'All' ? true : batch.status === statusFilter))
      .filter((batch) =>
        [batch.id, batch.title, batch.status, batch.operator, batch.outputText, batch.materials.join(' ')].some((value) =>
          String(value ?? '').toLowerCase().includes(normalized)
        )
      );

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'updated-asc') {
        return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      }
      if (sortBy === 'updated-desc') {
        return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
      if (sortBy === 'progress-asc') {
        return a.progress - b.progress;
      }
      return b.progress - a.progress;
    });

    return sorted;
  }, [batches, query, statusFilter, sortBy]);

  const selectedBatch = filteredBatches.find((batch) => batch.id === selectedBatchId) ?? filteredBatches[0] ?? batches[0] ?? null;

  const statusOptions = useMemo(() => {
    const set = new Set(batches.map((batch) => batch.status));
    return ['All', ...Array.from(set)];
  }, [batches]);

  const openEditModal = () => {
    if (!selectedBatch) {
      return;
    }
    setEditTitle(selectedBatch.title);
    setEditOutput(selectedBatch.outputText);
    setEditEta(selectedBatch.eta ? selectedBatch.eta.slice(0, 16) : '');
    setEditModalOpen(true);
  };

  const saveBatchChanges = async () => {
    if (!selectedBatch) {
      return;
    }

    const outputQty = Math.max(1, Number.parseInt(String(editOutput).replace(/\D+/g, ''), 10) || 1);

    try {
      const updated = await updateManufacturingBatch(selectedBatch.id, {
        title: editTitle,
        output: [{ productCode: 'FINISHED_GOODS', quantity: outputQty }],
        eta: editEta ? new Date(editEta).toISOString() : undefined,
      });
      setBatches((current) => current.map((batch) => (batch.id === updated.id ? updated : batch)));
      setEditModalOpen(false);
      setFeedback('Batch updated');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update batch');
    }
  };

  const removeBatch = async () => {
    if (!selectedBatch) {
      return;
    }
    try {
      await deleteManufacturingBatch(selectedBatch.id);
      setBatches((current) => current.filter((batch) => batch.id !== selectedBatch.id));
      setFeedback('Batch removed');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove batch');
    }
  };

  const markStart = async () => {
    if (!selectedBatch) {
      return;
    }
    try {
      const updated = await startManufacturingBatch(selectedBatch.id);
      setBatches((current) => current.map((batch) => (batch.id === updated.id ? updated : batch)));
      setFeedback('Batch started - raw materials deducted');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to start batch');
    }
  };

  const markComplete = async () => {
    if (!selectedBatch) {
      return;
    }
    try {
      const updated = await completeManufacturingBatch(selectedBatch.id);
      setBatches((current) => current.map((batch) => (batch.id === updated.id ? updated : batch)));
      setFeedback('Batch marked as completed - output added');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete batch');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/90 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
        <div className="border-b border-outline-variant/10 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">WIP list</p>
              <h3 className="mt-2 text-xl font-black text-on-surface sm:text-2xl lg:text-3xl">Batch tracking and production log</h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:max-w-md">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border-none bg-transparent text-sm outline-none" placeholder="Search batches" />
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface">
                  {sortByOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button onClick={() => setFilterModalOpen(true)} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Filter</button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] divide-y divide-outline-variant/10 overflow-auto">
          {loading && <p className="p-5 text-sm font-bold text-slate-500">Loading batches...</p>}
          {error && <p className="p-5 text-sm font-bold text-error">{error}</p>}
          {!loading && !error && filteredBatches.map((batch) => {
            const selected = batch.id === selectedBatchId;
            return (
              <button key={batch.id} onClick={() => setSelectedBatchId(batch.id)} className={`w-full text-left p-3 sm:p-5 transition-colors duration-150 ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-outline">{batch.id}</p>
                    <h4 className="mt-2 truncate font-black text-on-surface">{batch.title}</h4>
                    <p className="mt-1 text-sm text-slate-500">Operator {batch.operator}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${batch.status === 'COMPLETED' ? 'bg-secondary/10 text-secondary' : batch.status === 'CANCELLED' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>{batch.statusLabel ?? batch.status}</span>
                    <p className="mt-3 font-black text-on-surface">{batch.progress}%</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-outline">
                  <span className="truncate">{batch.outputText}</span>
                  <span>{formatShortDateTime(batch.updated)}</span>
                </div>
              </button>
            );
          })}
          {!loading && !error && !filteredBatches.length && <p className="p-5 text-sm text-slate-500">No manufacturing batches found.</p>}
        </div>
      </section>

      <aside className="space-y-4 sm:space-y-6">
        <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Selected batch</p>
          <h3 className="mt-2 text-2xl font-black text-on-surface sm:text-3xl lg:text-4xl">{selectedBatch?.id ?? 'No batch selected'}</h3>
          <p className="mt-2 text-slate-500">{selectedBatch?.title}</p>

          <div className="mt-6 rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 text-sm font-bold text-slate-600">
              <span>Status</span>
              <span className="text-primary">{selectedBatch?.statusLabel ?? selectedBatch?.status}</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${selectedBatch?.progress ?? 0}%` }}></div>
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-outline">{selectedBatch?.progress ?? 0}% complete</p>
          </div>

          {selectedBatch && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Materials</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {selectedBatch.materials.map((material) => (
                    <li key={material} className="break-words">{material}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Output</p>
                <p className="mt-2 text-lg font-black text-on-surface">{selectedBatch.outputText}</p>
                <p className="mt-2 text-sm text-slate-500">ETA {selectedBatch.eta ? formatShortDateTime(selectedBatch.eta) : '-'}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={openEditModal} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high">Edit</button>
            <button onClick={() => void removeBatch()} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high">Remove</button>
            <button
              onClick={() => void markStart()}
              disabled={!selectedBatch || selectedBatch.status !== 'IN_PROGRESS' || selectedBatch.materialConsumed}
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Production
            </button>
            <button
              onClick={() => void markComplete()}
              disabled={!selectedBatch || selectedBatch.status !== 'IN_PROGRESS' || !selectedBatch.materialConsumed || selectedBatch.outputAdded}
              className="rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Complete Production
            </button>
          </div>
          {feedback && <p className="mt-4 text-sm font-bold text-secondary">{feedback}</p>}
        </article>

        <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Production log</p>
          <h3 className="mt-2 text-lg font-black text-on-surface sm:text-xl lg:text-2xl">Sortable operational history</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between gap-4"><span>Current operator</span><span className="font-bold text-on-surface">{selectedBatch?.operator}</span></div>
            <div className="flex justify-between gap-4"><span>Last updated</span><span className="font-bold text-on-surface">{selectedBatch ? formatShortDateTime(selectedBatch.updated) : '-'}</span></div>
            <div className="flex justify-between gap-4"><span>Next action</span><span className="font-bold text-on-surface">Review quality gate</span></div>
          </div>
        </article>
      </aside>

      {filterModalOpen && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-2xl sm:max-w-lg sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xl font-black text-on-surface sm:text-2xl">WIP Filters</h4>
              <button onClick={() => setFilterModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low transition-colors duration-150 hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold">
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setStatusFilter('All'); setFilterModalOpen(false); }} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Reset</button>
              <button onClick={() => setFilterModalOpen(false)} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Apply</button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-2xl sm:max-w-lg sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xl font-black text-on-surface sm:text-2xl">Edit WIP Batch</h4>
              <button onClick={() => setEditModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low transition-colors duration-150 hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Batch title</span>
                <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Output</span>
                <input value={editOutput} onChange={(event) => setEditOutput(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">ETA</span>
                <input value={editEta} onChange={(event) => setEditEta(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditModalOpen(false)} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Cancel</button>
              <button onClick={() => void saveBatchChanges()} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

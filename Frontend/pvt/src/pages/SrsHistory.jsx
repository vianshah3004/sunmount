import { useEffect, useMemo, useState } from 'react';
import { formatINR, formatShortDate } from '../lib/formatters';
import {
  advanceHistoryRecord,
  deleteHistoryRecord,
  getHistoryRecords,
  updateHistoryRecord,
} from '../lib/api';

const filters = ['All', 'Sales', 'Purchase', 'Manufacturing'];

const sortComparators = {
  date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  status: (a, b) => a.status.localeCompare(b.status),
  type: (a, b) => a.type.localeCompare(b.type),
  value: (a, b) => Number(a.value) - Number(b.value),
};

export default function SrsHistory() {
  const [records, setRecords] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedId, setSelectedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getHistoryRecords({ page: 1, pageSize: 200 });
        if (!active) {
          return;
        }
        setRecords(response.rows);
        if (response.rows[0]) {
          setSelectedId(response.rows[0].id);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load history records');
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

  const filteredRecords = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const typeMatched = records.filter((record) => (activeFilter === 'All' ? true : record.type === activeFilter));
    const statusMatched = typeMatched.filter((record) => (statusFilter === 'All' ? true : record.status === statusFilter));
    const searchMatched = statusMatched.filter((record) =>
      [record.id, record.type, record.party, record.status, record.note].some((value) => String(value ?? '').toLowerCase().includes(normalized))
    );
    const sorted = [...searchMatched].sort((a, b) => {
      const comparator = sortComparators[sortKey] ?? sortComparators.date;
      const result = comparator(a, b);
      return sortDirection === 'asc' ? result : -result;
    });
    return sorted;
  }, [records, activeFilter, searchQuery, sortKey, sortDirection, statusFilter]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? records[0] ?? null;

  const availableStatuses = useMemo(() => {
    const values = new Set(records.map((record) => record.status));
    return ['All', ...Array.from(values)];
  }, [records]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const handleExportCsv = () => {
    const headers = ['id', 'type', 'party', 'status', 'date', 'value', 'note'];
    const lines = filteredRecords.map((record) =>
      [record.id, record.type, record.party, record.status, record.date, record.value, record.note]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'order-history.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('CSV exported');
  };

  const handleExportPdf = () => {
    const htmlRows = filteredRecords
      .map(
        (record) => `<tr>
          <td>${record.id}</td>
          <td>${record.type}</td>
          <td>${record.party}</td>
          <td>${record.status}</td>
          <td>${record.date}</td>
          <td>${typeof record.value === 'number' ? formatINR(record.value) : record.value}</td>
          <td>${record.note}</td>
        </tr>`
      )
      .join('');
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      setFeedback('Enable popups to export PDF');
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Order History Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            p { color: #555; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f6fa; }
          </style>
        </head>
        <body>
          <h1>Order History</h1>
          <p>Filter: ${activeFilter} | Sort: ${sortKey} (${sortDirection})</p>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>Party</th><th>Status</th><th>Date</th><th>Value</th><th>Note</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    setFeedback('Print dialog opened (Save as PDF)');
  };

  const openEdit = () => {
    if (!selectedRecord) {
      return;
    }
    setEditStatus(selectedRecord.status);
    setEditNote(selectedRecord.note);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedRecord) {
      return;
    }
    try {
      const updated = await updateHistoryRecord(selectedRecord.id, {
        status: editStatus,
        note: editNote,
      });
      setRecords((currentRecords) => currentRecords.map((record) => (record.id === selectedRecord.id ? updated : record)));
      setEditOpen(false);
      setFeedback('Record updated');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to update record');
    }
  };

  const moveToNextStage = async () => {
    if (!selectedRecord) {
      return;
    }
    try {
      const updated = await advanceHistoryRecord(selectedRecord.id);
      setRecords((currentRecords) => currentRecords.map((record) => (record.id === selectedRecord.id ? updated : record)));
      setFeedback(`Moved to ${updated.status}`);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to move record to next stage');
    }
  };

  const removeRecord = async () => {
    if (!selectedRecord) {
      return;
    }
    try {
      await deleteHistoryRecord(selectedRecord.id);
      setRecords((currentRecords) => currentRecords.filter((record) => record.id !== selectedRecord.id));
      setFeedback('Record removed');
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove record');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-3 rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Order history</p>
            <h3 className="mt-2 text-xl font-black text-on-surface sm:text-2xl lg:text-3xl">Separate sales, purchase, and manufacturing views</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-black transition-colors duration-150 ${activeFilter === filter ? 'bg-primary text-white' : 'bg-surface-container-low text-slate-500 hover:bg-surface-container-high'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:min-w-0 sm:w-full lg:w-[26rem]">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full border-none bg-transparent text-sm outline-none" placeholder="Search by ID, type, party, status, note" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAdvancedOpen(true)} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Filters</button>
            <button onClick={handleExportCsv} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Export CSV</button>
            <button onClick={handleExportPdf} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Export PDF</button>
          </div>
        </div>
      </section>

      {loading && <section className="rounded-2xl bg-surface-container-low p-4 text-sm font-bold text-slate-600">Loading history...</section>}
      {error && <section className="rounded-2xl bg-error/10 p-4 text-sm font-bold text-error">{error}</section>}
      {feedback && <section className="rounded-2xl bg-secondary/10 p-4 text-sm font-bold text-secondary">{feedback}</section>}

      <section className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-white/90 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
          <div className="border-b border-outline-variant/10 p-4 sm:p-6">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Ledger list</p>
            <h3 className="mt-2 text-lg font-black text-on-surface sm:text-xl lg:text-2xl">Sortable records</h3>
          </div>
          <div className="h-full w-full max-h-[70vh] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[800px] border-collapse lg:min-w-full">
              <thead className="sticky top-0 z-10 bg-surface-container-low">
                <tr className="text-[8px] font-black uppercase tracking-[0.22em] text-outline sm:text-[10px]">
                  <th className="px-4 py-4 sm:px-5">ID</th>
                  <th className="cursor-pointer px-4 py-4 sm:px-5" onClick={() => handleSort('type')}>Type</th>
                  <th className="px-4 py-4 sm:px-5">Party</th>
                  <th className="cursor-pointer px-4 py-4 sm:px-5" onClick={() => handleSort('status')}>Status</th>
                  <th className="cursor-pointer px-4 py-4 text-right sm:px-5" onClick={() => handleSort('value')}>Value</th>
                  <th className="cursor-pointer px-4 py-4 text-right sm:px-5" onClick={() => handleSort('date')}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const selected = record.id === selectedId;
                  return (
                    <tr key={record.id} onClick={() => setSelectedId(record.id)} className={`cursor-pointer border-t border-outline-variant/10 transition-colors duration-150 ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                      <td className="overflow-hidden whitespace-nowrap px-4 py-4 font-mono font-bold text-primary sm:px-5">{record.id}</td>
                      <td className="px-4 py-4 sm:px-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${record.type === 'Sales' ? 'bg-primary/10 text-primary' : record.type === 'Purchase' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="truncate px-4 py-4 font-bold text-on-surface sm:px-5">{record.party}</td>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">{record.status}</td>
                      <td className="px-4 py-4 text-right font-black sm:px-5">{typeof record.value === 'number' ? formatINR(record.value) : record.value}</td>
                      <td className="px-4 py-4 text-right text-slate-600 sm:px-5">{formatShortDate(record.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && !filteredRecords.length && <p className="p-5 text-sm text-slate-500">No records found.</p>}
          </div>
        </article>

        <article className="rounded-[2rem] border border-outline-variant/20 bg-white/90 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-secondary">Detail panel</p>
          <h3 className="mt-2 text-2xl font-black text-on-surface sm:text-3xl">{selectedRecord?.party ?? 'No record'}</h3>
          <p className="mt-2 text-slate-500">{selectedRecord?.note ?? 'Select a record to view details.'}</p>

          {selectedRecord && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Reference</p>
                <p className="mt-2 text-lg font-black text-on-surface">{selectedRecord.id}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Date</p>
                <p className="mt-2 text-lg font-black text-on-surface">{formatShortDate(selectedRecord.date)}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</p>
                <p className="mt-2 text-lg font-black text-on-surface">{selectedRecord.status}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Value</p>
                <p className="mt-2 text-lg font-black text-on-surface">{typeof selectedRecord.value === 'number' ? formatINR(selectedRecord.value) : selectedRecord.value}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button onClick={openEdit} className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90 sm:w-auto">Edit</button>
            <button onClick={() => void moveToNextStage()} className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high sm:w-auto">Move To Next Stage</button>
            <button onClick={() => void removeRecord()} className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface transition-colors duration-150 hover:bg-surface-container-high sm:w-auto">Delete</button>
          </div>
        </article>
      </section>

      {advancedOpen && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-2xl sm:max-w-lg sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xl font-black text-on-surface sm:text-2xl">History Filters</h4>
              <button onClick={() => setAdvancedOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low transition-colors duration-150 hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status filter</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold">
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setStatusFilter('All'); setAdvancedOpen(false); }} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Reset</button>
              <button onClick={() => setAdvancedOpen(false)} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Apply</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && selectedRecord && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-outline-variant/20 bg-white p-4 shadow-2xl sm:max-w-lg sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xl font-black text-on-surface sm:text-2xl">Edit Record</h4>
              <button onClick={() => setEditOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low transition-colors duration-150 hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Status</span>
                <input value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="mt-2 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold" />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Note</span>
                <textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditOpen(false)} className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold transition-colors duration-150 hover:bg-surface-container-high">Cancel</button>
              <button onClick={() => void saveEdit()} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

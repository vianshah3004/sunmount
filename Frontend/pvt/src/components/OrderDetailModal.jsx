export default function OrderDetailModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md modal-backdrop" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col overflow-hidden modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="glass-panel p-8 pb-6 border-b-0 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">Order #LUM-88219</h2>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full">Processing</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Oct 24, 2023 • 14:32 PM
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">database</span>
                  Ref: ERP-900-X
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all text-slate-400">
                <span className="material-symbols-outlined">print</span>
              </button>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all text-slate-400">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-error-container text-error rounded-full transition-all ml-2">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="flex gap-4 p-4 bg-surface-container-low rounded-lg items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-outline-variant/30 flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">business</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary opacity-70 mb-0.5">Customer</p>
                <h4 className="font-bold text-on-surface truncate">Vanguard Solutions Ltd</h4>
                <p className="text-xs text-slate-500 truncate">accounts@vanguard-ops.com</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-surface-container-low rounded-lg items-center">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-tertiary">factory</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-tertiary opacity-70 mb-0.5">Primary Supplier</p>
                <h4 className="font-bold text-on-surface truncate">Neo-Tek Global Fabrications</h4>
                <p className="text-xs text-slate-500 truncate">Logistics Node 04, Berlin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-8 pt-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Order Manifest</h3>
            <span className="text-xs font-medium text-slate-400">4 Items Total</span>
          </div>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-surface-container-high/50 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Product Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Price</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <tr className="hover:bg-white transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">memory</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Neural Interface Chipset v2</p>
                        <p className="text-[10px] text-slate-400">SKU: NIC-2024-X</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-medium text-on-surface">12</td>
                  <td className="px-6 py-5 text-right text-slate-600">$450.00</td>
                  <td className="px-6 py-5 text-right font-bold text-on-surface">$5,400.00</td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-tertiary text-sm">ac_unit</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Quantum Cooling Module</p>
                        <p className="text-[10px] text-slate-400">SKU: QCM-99-L</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-medium text-on-surface">2</td>
                  <td className="px-6 py-5 text-right text-slate-600">$1,200.00</td>
                  <td className="px-6 py-5 text-right font-bold text-on-surface">$2,400.00</td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-sm">cable</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Hyper-Link Fiber Optics (50m)</p>
                        <p className="text-[10px] text-slate-400">SKU: FO-50-PRO</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-medium text-on-surface">45</td>
                  <td className="px-6 py-5 text-right text-slate-600">$12.50</td>
                  <td className="px-6 py-5 text-right font-bold text-on-surface">$562.50</td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">AI Processing License (Annual)</p>
                        <p className="text-[10px] text-slate-400">SKU: SW-AI-2024</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center font-medium text-on-surface">1</td>
                  <td className="px-6 py-5 text-right text-slate-600">$899.00</td>
                  <td className="px-6 py-5 text-right font-bold text-on-surface">$899.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-surface-container-low/50 border-t-0 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Invoice Amount</p>
            <p className="text-3xl font-black text-on-surface">$9,261.50</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 bg-surface-container-highest text-on-surface-variant rounded-xl font-bold text-sm hover:bg-outline-variant/30 transition-all active:scale-95">
              Delete
            </button>
            <button className="flex-1 sm:flex-none px-6 py-3 bg-white text-primary border border-primary/20 rounded-xl font-bold text-sm hover:bg-primary/5 transition-all active:scale-95">
              Edit Details
            </button>
            <button className="flex-1 sm:flex-none px-8 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Next Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

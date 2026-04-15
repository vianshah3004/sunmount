export default function NotificationPanel({ onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/5 backdrop-blur-[2px] z-50 modal-backdrop" onClick={onClose}></div>

      {/* Panel */}
      <div className="fixed top-4 right-4 bottom-4 w-[420px] bg-white/70 glass-effect rounded-xl z-[60] flex flex-col shadow-[0px_20px_40px_rgba(0,87,194,0.12)] notification-slide-in">
        <div className="p-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface italic">Alerts Center</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-primary">3 New Notifications</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-8 pb-4 flex gap-6 text-sm font-semibold border-b border-outline-variant/10">
          <button className="text-primary border-b-2 border-primary pb-2">All Activity</button>
          <button className="text-slate-400 hover:text-slate-600 transition-colors pb-2">System</button>
          <button className="text-slate-400 hover:text-slate-600 transition-colors pb-2">Orders</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Critical Low Stock */}
          <div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-error group hover:translate-x-[-4px] transition-transform">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface tracking-tight">Critical Low Stock</h3>
                  <span className="text-[0.6875rem] font-bold uppercase text-error tracking-tighter">Just Now</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">SKU #LX-940 (Titanium Plates) has dropped below the safety threshold of 50 units. Current: 12.</p>
                <div className="pt-3 flex gap-3">
                  <button className="text-xs font-bold text-primary hover:underline">Reorder Now</button>
                  <button className="text-xs font-bold text-slate-400">Ignore</button>
                </div>
              </div>
            </div>
            <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
          </div>

          {/* Out for Delivery */}
          <div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-primary group hover:translate-x-[-4px] transition-transform">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface tracking-tight">Out for Delivery</h3>
                  <span className="text-[0.6875rem] font-bold uppercase text-slate-400 tracking-tighter">14m ago</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">Order #55291 for Aerospace Corp is out for delivery in Chicago. ETA: 2:45 PM.</p>
              </div>
            </div>
            <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
          </div>

          {/* Batch Complete */}
          <div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-secondary group hover:translate-x-[-4px] transition-transform">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface tracking-tight">Batch Complete</h3>
                  <span className="text-[0.6875rem] font-bold uppercase text-slate-400 tracking-tighter">48m ago</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">Manufacturing Batch #A-204 (Carbon Weave) finalized. QC passed 100%.</p>
              </div>
            </div>
            <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
          </div>

          {/* System Update */}
          <div className="bg-surface-container-low/50 p-6 rounded-xl opacity-70 group hover:opacity-100 transition-opacity">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-slate-500">update</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface tracking-tight">System Update</h3>
                  <span className="text-[0.6875rem] font-bold uppercase text-slate-400 tracking-tighter">2h ago</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">Luminous OS updated to v4.2.1. See what's new in the release notes.</p>
              </div>
            </div>
          </div>

          {/* Payment Received */}
          <div className="bg-surface-container-low/50 p-6 rounded-xl opacity-70 group hover:opacity-100 transition-opacity">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-slate-500">account_balance_wallet</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-on-surface tracking-tight">Payment Received</h3>
                  <span className="text-[0.6875rem] font-bold uppercase text-slate-400 tracking-tighter">5h ago</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">Invoice #88-299 paid by Global Logistics ($12,400.00).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-outline-variant/10 bg-white/40 glass-effect">
          <button className="w-full bg-surface-container-highest py-4 rounded-xl font-bold text-on-surface hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">done_all</span>
            Mark All as Read
          </button>
        </div>
      </div>
    </>
  );
}

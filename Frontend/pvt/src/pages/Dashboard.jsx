import Topbar from "../layout/Topbar";

export default function Dashboard() {
  return (
    <main className="ml-72 p-8">
      <Topbar title="Operations Command" subtitle="Real-time supply chain orchestration" />
      <section className="grid grid-cols-4 gap-6 mb-10">
        <div className="tilt-card bg-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border border-outline-variant/10 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12%
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-500">Inventory Value</h4>
          <p className="text-2xl font-bold text-on-surface">₹4,28,50,000</p>
        </div>
        
        <div className="tilt-card bg-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border border-outline-variant/10 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
            <span className="text-xs font-bold text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">priority_high</span> Critical
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-500">Orders Pending</h4>
          <p className="text-2xl font-bold text-on-surface">142</p>
        </div>

        <div className="tilt-card bg-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border border-outline-variant/10 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>conveyor_belt</span>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">sync</span> Active
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-500">WIP Status</h4>
          <p className="text-2xl font-bold text-on-surface">84 Units</p>
        </div>

        <div className="tilt-card bg-surface-container-lowest p-6 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border border-outline-variant/10 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-fixed/30 rounded-lg">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
            </div>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">Stable</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-500">Business Health Score</h4>
          <p className="text-2xl font-bold text-on-surface">94/100</p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <section className="col-span-8 bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden shadow-[0px_20px_40px_rgba(0,87,194,0.04)] border border-outline-variant/15 h-[500px]">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Operational Lifecycle Flow</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[0.6rem] font-bold uppercase tracking-wider">Live Sync</span>
            </div>
          </div>
          <div className="relative h-64 w-full flex items-center justify-between px-12">
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 rounded-xl bg-white shadow-xl flex flex-col items-center justify-center border-t-4 border-primary">
                <span className="material-symbols-outlined text-primary text-3xl mb-1">inventory</span>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase">Inventory</span>
              </div>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 rounded-xl bg-white shadow-2xl flex flex-col items-center justify-center border-t-4 border-secondary scale-110">
                <span className="material-symbols-outlined text-secondary text-4xl mb-1">shopping_bag</span>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase">Orders</span>
              </div>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 rounded-xl bg-white shadow-xl flex flex-col items-center justify-center border-t-4 border-tertiary">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-1">precision_manufacturing</span>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase">Manufacturing</span>
              </div>
            </div>
            <div className="absolute top-1/2 left-24 right-24 h-[2px] bg-slate-100 -translate-y-1/2">
              <div className="glow-line w-full h-full"></div>
            </div>
          </div>
          <div className="absolute bottom-12 left-12 p-4 glass-panel rounded-lg border border-white">
            <p className="text-[0.6rem] font-black text-slate-400 uppercase mb-2">Supply Latency</p>
            <div className="flex items-end gap-1">
              <div className="w-1.5 h-4 bg-primary rounded-full"></div>
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              <div className="w-1.5 h-3 bg-primary rounded-full"></div>
              <div className="w-1.5 h-8 bg-secondary rounded-full"></div>
              <span className="ml-2 text-sm font-bold">1.2ms</span>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-50 rounded-full blur-[100px] opacity-60"></div>
        </section>

        <section className="col-span-4 space-y-6">
          <div className="glass-panel rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,87,194,0.08)] border border-white ring-1 ring-black/5 min-h-[400px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tertiary to-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">bolt</span>
              </div>
              <h3 className="font-bold text-slate-800">Luminous Insights</h3>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-white/50 rounded-lg border-l-4 border-secondary">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Reorder Suggestion</h4>
                <p className="text-sm text-slate-700 leading-relaxed italic">"Inventory for <span className="font-bold text-slate-900">Titanium Grade 5</span> is below safety threshold. Recommend restock of 500 units to meet Q3 manufacturing forecasts."</p>
                <button className="mt-4 w-full py-2 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold hover:brightness-105 transition-all">Approve Purchase Order</button>
              </div>
              <div className="p-4 bg-white/50 rounded-lg border-l-4 border-tertiary">
                <h4 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-1">Bottleneck Alert</h4>
                <p className="text-sm text-slate-700 leading-relaxed">Line 4 assembly is experiencing a 12% drop in throughput. Automated diagnostic suggests preventative maintenance on Servo-X.</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 bg-tertiary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-tertiary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-tertiary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[0.7rem] text-slate-400 font-medium">Analyzing real-time shift data...</span>
              </div>
            </div>
          </div>
          
          <div className="bg-primary p-6 rounded-xl text-white relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">Optimize Logistics</h3>
              <p className="text-white/80 text-sm mb-4">Reduce shipping costs by up to 14% using multi-hop routing.</p>
              <span className="inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-all">
                Run Simulation <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
              <span className="material-symbols-outlined text-[120px]">local_shipping</span>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-12 bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,87,194,0.04)]">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-900">Recent Movements</h3>
          <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
            View Full Ledger <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-12 px-4 py-3 border-b border-outline-variant/10 text-[0.6875rem] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-5">Item / Serial</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Flow</div>
            <div className="col-span-2 text-right">Value</div>
            <div className="col-span-1"></div>
          </div>
          <div className="space-y-1 mt-4">
            
            <div className="grid grid-cols-12 px-4 py-4 hover:bg-slate-50 transition-colors items-center rounded-lg">
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">precision_manufacturing</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Carbon Fiber Shell v2</p>
                  <p className="text-xs text-slate-500">ID: #CF-99201-B</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[0.65rem] font-black uppercase">Raw Material</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="text-xs font-semibold text-slate-600">Inbound</span>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-bold text-slate-800">₹12,40,000</p>
              </div>
              <div className="col-span-1 text-right">
                <button className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</button>
              </div>
            </div>

            <div className="grid grid-cols-12 px-4 py-4 hover:bg-slate-50 transition-colors items-center rounded-lg">
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">memory</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Cortex Neural Link</p>
                  <p className="text-xs text-slate-500">ID: #NL-4412-X</p>
                </div>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded bg-purple-50 text-purple-600 text-[0.65rem] font-black uppercase">Assembly</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="text-xs font-semibold text-slate-600">Manufacturing</span>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-bold text-slate-800">₹45,10,000</p>
              </div>
              <div className="col-span-1 text-right">
                <button className="material-symbols-outlined text-slate-300 hover:text-slate-600">more_vert</button>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-primary rounded-full shadow-[0px_20px_40px_rgba(0,87,194,0.3)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group z-50">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
      </button>
    </main>
  );
}

export default function Inventory() {
  return (
    <main className="ml-72 flex-1 flex flex-col h-full relative">
      <header className="fixed top-0 left-72 right-0 z-40 bg-white/70 backdrop-blur-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] px-8 py-4 flex justify-between items-center h-20">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tighter text-slate-900">Luminous OS</span>
          <div className="h-6 w-px bg-outline-variant mx-2"></div>
          <h2 className="text-lg font-semibold text-primary">Inventory Management</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="pl-10 pr-4 py-2 bg-surface-container-low rounded-full border-none focus:ring-2 focus:ring-primary w-64 text-sm outline-none" placeholder="Search assets..." type="text" />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-blue-50/50 rounded-full transition-colors text-slate-500">
              <span className="material-symbols-outlined">smart_toy</span>
            </button>
            <button className="p-2 hover:bg-blue-50/50 rounded-full transition-colors text-slate-500 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <div className="mt-24 px-8 pb-8 flex-1 flex gap-8 overflow-hidden">
        {/* Left: Scrollable Product List */}
        <section className="w-[60%] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-md font-bold text-on-surface">Asset Directory</h3>
              <p className="text-label-sm text-outline uppercase tracking-widest mt-1">Total Assets: 2,492</p>
            </div>
            <div className="flex gap-2">
              <button className="px-6 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Add New
              </button>
              <button className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-variant transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">filter_list</span> Filter
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl bg-surface-container-low p-4 relative">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead className="sticky top-0 bg-surface-container-low z-10">
                <tr>
                  <th className="px-4 py-2 text-label-sm text-outline uppercase tracking-wider font-semibold">Code</th>
                  <th className="px-4 py-2 text-label-sm text-outline uppercase tracking-wider font-semibold">Product Name</th>
                  <th className="px-4 py-2 text-label-sm text-outline uppercase tracking-wider font-semibold">Weight</th>
                  <th className="px-4 py-2 text-label-sm text-outline uppercase tracking-wider font-semibold text-right">Price (₹)</th>
                  <th className="px-4 py-2 text-label-sm text-outline uppercase tracking-wider font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="bg-surface-container-lowest shadow-sm rounded-xl hover:scale-[1.01] transition-transform cursor-pointer group">
                  <td className="px-4 py-4 rounded-l-xl font-mono text-primary font-bold">LUM-924-A</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-on-surface">Quantum Processor Core</div>
                    <div className="text-[10px] text-outline">Electronics / Processing</div>
                  </td>
                  <td className="px-4 py-4 text-outline-variant">1.4 kg</td>
                  <td className="px-4 py-4 text-right font-bold">₹1,45,000</td>
                  <td className="px-4 py-4 rounded-r-xl">
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> In Stock
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-white/40 hover:bg-white shadow-sm rounded-xl hover:scale-[1.01] transition-all cursor-pointer">
                  <td className="px-4 py-4 rounded-l-xl font-mono text-slate-500">LUM-112-C</td>
                  <td className="px-4 py-4 font-semibold text-on-surface">Neural Mesh Adapter</td>
                  <td className="px-4 py-4 text-outline-variant">0.2 kg</td>
                  <td className="px-4 py-4 text-right font-bold">₹42,300</td>
                  <td className="px-4 py-4 rounded-r-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Auto-Refill
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-white/40 hover:bg-white shadow-sm rounded-xl hover:scale-[1.01] transition-all cursor-pointer">
                  <td className="px-4 py-4 rounded-l-xl font-mono text-slate-500">LUM-445-B</td>
                  <td className="px-4 py-4 font-semibold text-on-surface">Kinetic Battery Cell</td>
                  <td className="px-4 py-4 text-outline-variant">12.5 kg</td>
                  <td className="px-4 py-4 text-right font-bold">₹89,000</td>
                  <td className="px-4 py-4 rounded-r-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-600 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Low Stock
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-white/40 hover:bg-white shadow-sm rounded-xl hover:scale-[1.01] transition-all cursor-pointer">
                  <td className="px-4 py-4 rounded-l-xl font-mono text-slate-500">LUM-003-X</td>
                  <td className="px-4 py-4 font-semibold text-on-surface">Optical Cooling Fluid</td>
                  <td className="px-4 py-4 text-outline-variant">5.0 kg</td>
                  <td className="px-4 py-4 text-right font-bold">₹12,500</td>
                  <td className="px-4 py-4 rounded-r-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Critical
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-white/40 hover:bg-white shadow-sm rounded-xl hover:scale-[1.01] transition-all cursor-pointer">
                  <td className="px-4 py-4 rounded-l-xl font-mono text-slate-500">LUM-771-K</td>
                  <td className="px-4 py-4 font-semibold text-on-surface">Titanium Alloy Housing</td>
                  <td className="px-4 py-4 text-outline-variant">45.0 kg</td>
                  <td className="px-4 py-4 text-right font-bold">₹2,10,000</td>
                  <td className="px-4 py-4 rounded-r-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> In Stock
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Glassmorphic Detail Panel */}
        <aside className="w-[40%] flex flex-col gap-6">
          <div className="glass-panel flex-1 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col p-8 border border-white/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary/10 blur-[80px] rounded-full"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">ID: LUM-924-A</span>
                  <h4 className="text-2xl font-black text-on-surface mt-2 leading-tight">Quantum Processor Core</h4>
                  <p className="text-sm text-outline mt-1">High-density processing unit for enterprise cloud clusters.</p>
                </div>
                <button className="p-2 bg-surface-container-low rounded-full hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-10 relative z-10">
              <div className="box-container mb-12">
                <div className="box-3d">
                  <div className="box-face face-front flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/40 text-6xl">deployed_code</span>
                  </div>
                  <div className="box-face face-back"></div>
                  <div className="box-face face-right"></div>
                  <div className="box-face face-left"></div>
                  <div className="box-face face-top"></div>
                  <div className="box-face face-bottom"></div>
                </div>
              </div>
              <div className="w-full max-w-sm">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-label-sm text-outline uppercase font-bold">Storage Capacity</p>
                  <p className="text-headline-md font-black text-primary">84<span className="text-sm font-medium text-slate-400">%</span></p>
                </div>
                <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{ width: "84%" }}></div>
                </div>
                <div className="flex justify-between mt-3 text-[10px] text-outline font-bold uppercase tracking-wider">
                  <span>Unit: A-12 Sector</span>
                  <span>16 Slots Free</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-4 bg-white/50 rounded-xl border border-white/40">
                <p className="text-[10px] uppercase text-outline font-bold tracking-wider mb-1">Stock Level</p>
                <p className="text-xl font-black text-on-surface">412 Units</p>
                <p className="text-[10px] text-secondary font-bold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span> +12% this week
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-white/40">
                <p className="text-[10px] uppercase text-outline font-bold tracking-wider mb-1">Asset Value</p>
                <p className="text-xl font-black text-on-surface">₹5.97 Cr</p>
                <p className="text-[10px] text-tertiary font-bold flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Forecast: Stable
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 flex gap-3 relative z-10">
              <button className="flex-1 py-4 bg-on-surface text-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined">output</span> Dispatch Stock
              </button>
              <button className="px-6 py-4 bg-secondary-fixed text-on-secondary-fixed rounded-xl font-bold hover:scale-[0.98] transition-transform">
                <span className="material-symbols-outlined">history</span>
              </button>
            </div>
          </div>

          <div className="bg-tertiary-container text-on-tertiary-container p-6 rounded-xl flex items-center gap-4 shadow-lg overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Inventory Insight</p>
              <p className="text-sm font-medium mt-1">Refill recommended in 4 days based on current dispatch velocity.</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full flex items-center gap-4 shadow-[0px_20px_40px_rgba(0,87,194,0.15)] border border-primary/10 z-50">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
          <span className="material-symbols-outlined text-sm">terminal</span> COMMAND
        </div>
        <div className="h-4 w-px bg-outline-variant"></div>
        <div className="flex gap-4">
          <button className="text-outline hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">qr_code_scanner</span> Scan
          </button>
          <button className="text-outline hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">print</span> Labels
          </button>
          <button className="text-outline hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">share</span> Export
          </button>
        </div>
      </div>
    </main>
  );
}


export default function Reports() {
  return (
    <>
      

<header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl docked full-width top-0 sticky z-50 flex justify-between items-center px-8 py-4 w-full shadow-[0px_20px_40px_rgba(0,87,194,0.06)]">
<div className="flex items-center gap-8">
<span className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Luminous OS</span>
<nav className="hidden md:flex gap-6 items-center">
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all px-3 py-1 rounded-full" href="#">Inventory</a>
<a className="text-blue-700 dark:text-blue-400 font-bold border-b-2 border-blue-700 px-3 py-1" href="#">Reports</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all px-3 py-1 rounded-full" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<div className="relative hidden lg:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-sm w-64" placeholder="Global search..." type="text"/>
</div>
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" data-icon="notifications">notifications</button>
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors" data-icon="settings">settings</button>
<div className="h-10 w-10 rounded-full bg-primary-container overflow-hidden ring-2 ring-white">
<img alt="User profile" className="h-full w-full object-cover" data-alt="Close-up portrait of a professional woman with a soft confident smile in a bright modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCPJBDKmIPnJASnwM0qt5YBvN6rtWoz81QXjDjUI508Dbkn_5Qmt5q4h8uriYKBSA3E7W-JEi-Z8LHPrqFgOqDh4QY_zzIlkMjwa3G797LuEsB8xnAiApMC0A4xPEUdvGUBELw_CQoPgvKpi9occZ6VS4tqxWyRNv7tFsSsXB5pJHEUVBZqN91w9PUN1rcHeJQY-P6LuXOmvwIO0hW2NmEK9KOAqj81YKpVjtcWhd4jWSPV7z3oKYxlyD52X_MpUbDbJqka4vmjwXj"/>
</div>
</div>
</header>
<div className="flex">

<aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 hidden lg:flex">
<div className="px-6 mb-8">
<div className="flex items-center gap-3 p-3 bg-surface-container-highest/30 rounded-lg">
<div className="w-10 h-10 bg-on-background rounded-md flex items-center justify-center text-white font-black text-lg">G</div>
<div>
<p className="text-sm font-black text-slate-900">Global Ops</p>
<p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Enterprise Tier</p>
</div>
</div>
</div>
<nav className="flex-1 px-4 space-y-1">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="text-sm font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="text-sm font-medium">Orders</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="text-sm font-medium">Customers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="factory">factory</span>
<span className="text-sm font-medium">Suppliers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 translate-x-1" href="#">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span className="text-sm font-medium">Logistics Reports</span>
</a>
</nav>
<div className="px-4 mt-auto space-y-1 pt-6 border-t border-outline-variant/10">
<button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm mb-4 active:scale-95 transition-transform">
<span className="material-symbols-outlined text-sm">add</span>
                    New Entry
                </button>
<a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-primary transition-colors" href="#">
<span className="material-symbols-outlined text-lg" data-icon="help">help</span>
<span className="text-xs font-medium">Support</span>
</a>
<a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-primary transition-colors" href="#">
<span className="material-symbols-outlined text-lg" data-icon="archive">archive</span>
<span className="text-xs font-medium">Archive</span>
</a>
</div>
</aside>

<main className="flex-1 lg:ml-64 p-8">
<div className="max-w-7xl mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
<div>
<span className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary mb-3 block">Intelligence Layer</span>
<h1 className="text-display-lg font-black tracking-tight text-on-surface leading-tight">Reports &amp; <br/><span className="text-primary">Data Insights.</span></h1>
</div>
<div className="flex gap-3">
<button className="bg-surface-container-highest px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors">
<span className="material-symbols-outlined text-lg" data-icon="download">download</span>
                            Export CSV
                        </button>
<button className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-[0px_10px_20px_rgba(0,87,194,0.2)]">
<span className="material-symbols-outlined text-lg" data-icon="picture_as_pdf">picture_as_pdf</span>
                            Download PDF
                        </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
<div className="md:col-span-2 p-8 rounded-xl bg-primary-container text-on-primary-container relative overflow-hidden group">
<div className="relative z-10">
<p className="text-sm font-bold opacity-80 mb-2">Total Generated Value</p>
<h2 className="text-5xl font-black mb-4 tracking-tighter">$1,284,902.00</h2>
<div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
<span className="material-symbols-outlined text-sm">trending_up</span>
                                +12.4% vs last month
                            </div>
</div>
<div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
<span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
</div>
</div>
<div className="p-8 rounded-xl bg-surface-container-lowest shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col justify-between">
<p className="text-sm font-bold text-outline uppercase tracking-wider">Processing Time</p>
<div>
<h3 className="text-3xl font-bold text-on-surface">1.2s</h3>
<p className="text-xs text-secondary font-bold mt-1">High Velocity</p>
</div>
<div className="h-1 w-full bg-surface-container-highest rounded-full mt-4 overflow-hidden">
<div className="h-full bg-secondary w-3/4 rounded-full"></div>
</div>
</div>
<div className="p-8 rounded-xl bg-surface-container-lowest shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col justify-between">
<p className="text-sm font-bold text-outline uppercase tracking-wider">Reports Active</p>
<div>
<h3 className="text-3xl font-bold text-on-surface">24</h3>
<p className="text-xs text-tertiary font-bold mt-1">Automated Sync</p>
</div>
<div className="flex -space-x-2 mt-4">
<div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
<div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
<div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-[10px] flex items-center justify-center text-white font-bold">+18</div>
</div>
</div>
</div>

<div className="mb-12 sticky top-24 z-40">
<div className="glass-panel p-3 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-wrap items-center gap-4 border border-white/40">
<div className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full">
<span className="material-symbols-outlined text-primary text-lg">category</span>
<select className="bg-transparent border-none focus:ring-0 text-sm font-bold text-on-surface-variant cursor-pointer pr-8">
<option>Type: Sales</option>
<option>Type: Purchase</option>
<option>Type: Manufacturing</option>
</select>
</div>
<div className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full">
<span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
<span className="text-sm font-bold text-on-surface-variant">Date: Oct 01 - Oct 31, 2023</span>
<span className="material-symbols-outlined text-outline-variant text-sm">expand_more</span>
</div>
<div className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full">
<span className="material-symbols-outlined text-primary text-lg">filter_alt</span>
<span className="text-sm font-bold text-on-surface-variant">More Filters</span>
</div>
<div className="ml-auto flex items-center gap-2">
<div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
<span className="text-xs font-bold text-secondary uppercase tracking-widest">Real-time view</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.03)] overflow-hidden">
<div className="px-8 py-6 flex justify-between items-center bg-white/50 border-b border-outline-variant/10">
<h3 className="text-lg font-bold">Transaction Ledger</h3>
<div className="flex items-center gap-4">
<div className="flex items-center gap-2 text-xs font-bold text-outline">
<span className="w-3 h-3 rounded-full bg-secondary"></span> Completed
                            </div>
<div className="flex items-center gap-2 text-xs font-bold text-outline">
<span className="w-3 h-3 rounded-full bg-tertiary"></span> Pending
                            </div>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full border-collapse">
<thead>
<tr className="text-left border-b border-outline-variant/10">
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">Reference ID</th>
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">Client / Vendor</th>
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">Category</th>
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline text-right">Volume</th>
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline text-right">Net Value</th>
<th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline text-center">Status</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/5">
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-8 py-6 font-bold text-sm">TXN-90281</td>
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">NS</div>
<span className="text-sm font-medium">Nexus Solutions</span>
</div>
</td>
<td className="px-8 py-6">
<span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Manufacturing</span>
</td>
<td className="px-8 py-6 text-right font-medium text-sm">2,450 units</td>
<td className="px-8 py-6 text-right font-black text-sm">$48,200.00</td>
<td className="px-8 py-6 text-center">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-8 py-6 font-bold text-sm">TXN-90282</td>
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">AL</div>
<span className="text-sm font-medium">Aero Logistics</span>
</div>
</td>
<td className="px-8 py-6">
<span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Shipping</span>
</td>
<td className="px-8 py-6 text-right font-medium text-sm">120 units</td>
<td className="px-8 py-6 text-right font-black text-sm">$3,150.00</td>
<td className="px-8 py-6 text-center">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-8 py-6 font-bold text-sm">TXN-90285</td>
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">QT</div>
<span className="text-sm font-medium">Quantum Tech</span>
</div>
</td>
<td className="px-8 py-6">
<span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Sales</span>
</td>
<td className="px-8 py-6 text-right font-medium text-sm">890 units</td>
<td className="px-8 py-6 text-right font-black text-sm">$129,000.00</td>
<td className="px-8 py-6 text-center">
<span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 0" }}>pending</span>
</td>
</tr>
<tr className="hover:bg-surface-container-low transition-colors group">
<td className="px-8 py-6 font-bold text-sm">TXN-90289</td>
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">VI</div>
<span className="text-sm font-medium">Velocity Inc</span>
</div>
</td>
<td className="px-8 py-6">
<span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Manufacturing</span>
</td>
<td className="px-8 py-6 text-right font-medium text-sm">45 units</td>
<td className="px-8 py-6 text-right font-black text-sm">$890.00</td>
<td className="px-8 py-6 text-center">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-8 py-6 border-t border-outline-variant/10 flex justify-between items-center text-xs font-bold text-outline">
<span>Showing 4 of 128 results</span>
<div className="flex gap-2">
<button className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_left</span></button>
<button className="px-3 py-1 bg-primary text-on-primary rounded-lg">1</button>
<button className="px-3 py-1 hover:bg-surface-container rounded-lg">2</button>
<button className="px-3 py-1 hover:bg-surface-container rounded-lg">3</button>
<button className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
</div>
</div>
</main>
</div>

<div className="fixed bottom-8 right-8 z-50">
<div className="glass-panel p-6 rounded-xl border border-tertiary-fixed shadow-[0px_20px_60px_rgba(91,60,221,0.2)] w-80 translate-y-0 hover:-translate-y-2 transition-transform duration-300">
<div className="flex items-center gap-3 mb-4">
<div className="p-2 bg-tertiary rounded-lg text-white">
<span className="material-symbols-outlined text-lg" data-icon="psychology">psychology</span>
</div>
<div>
<h4 className="text-sm font-black text-on-surface">AI Observation</h4>
<p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Automation active</p>
</div>
</div>
<p className="text-xs leading-relaxed text-on-surface-variant font-medium">
                "Sales volume in <span className="text-tertiary font-bold">Manufacturing</span> is trending 15% higher than average. Consider increasing supplier bandwidth by end of week."
            </p>
<button className="mt-4 w-full py-2 bg-tertiary-container text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all">
                Execute Rule
            </button>
</div>
</div>

    </>
  );
}
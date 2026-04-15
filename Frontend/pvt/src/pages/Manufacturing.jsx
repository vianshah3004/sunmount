
export default function Manufacturing() {
  return (
    <>
      

<nav className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 py-4 w-full shadow-[0px_20px_40px_rgba(0,87,194,0.06)]">
<div className="flex items-center gap-8">
<span className="text-xl font-bold tracking-tighter text-slate-900">Luminous OS</span>
<div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full gap-3">
<span className="material-symbols-outlined text-outline">search</span>
<input className="bg-transparent border-none focus:ring-0 text-sm w-64" placeholder="Search production line..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors scale-95 active:scale-90 transition-transform">
<span className="material-symbols-outlined text-slate-500">smart_toy</span>
</button>
<button className="p-2 rounded-full hover:bg-blue-50/50 transition-colors scale-95 active:scale-90 transition-transform">
<span className="material-symbols-outlined text-slate-500">notifications</span>
</button>
<div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container ml-2">
<img alt="User profile" data-alt="portrait of a professional production manager in a clean modern office setting with soft natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8XdD8GHh4Md14K8bdocdTu43qllQ3tBrlIN__vseuy5QUcmjYj4u0_eiGZpgCHzLREiHDc3iUbkYKahK6u-vHtRUOYYqeIvpm_6SmSKUsuz-y3lqq54zwJoxK5s0bQCe1RUrylvo4Dg7R90n11D4eNRrj5e_iVZtIQd5_0C0CTR4PU6IgaNRS2-YViXuJygoZpRO31gfu9WktbW6-Mv4RMLo34NHOI_SR1PUz7qT_Ep4f8ZHVOu7RQUI1nB5lciuIxI0vZ8jkpHJi"/>
</div>
</div>
</nav>

<aside className="fixed left-4 top-24 bottom-4 w-64 rounded-[3rem] z-50 bg-slate-50/80 backdrop-blur-2xl flex flex-col p-6 gap-2 shadow-[0px_20px_40px_rgba(0,87,194,0.06)]">
<div className="mb-8 px-4">
<h2 className="text-lg font-black text-blue-700">Luminous</h2>
<p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">Enterprise OS</p>
</div>
<nav className="flex-1 flex flex-col gap-1">
<a className="flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="text-[0.875rem]">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">inventory_2</span>
<span className="text-[0.875rem]">Inventory</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">payments</span>
<span className="text-[0.875rem]">Sales</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="text-[0.875rem]">Purchase</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-full bg-white text-blue-700 shadow-sm border-l-4 border-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">factory</span>
<span className="text-[0.875rem] font-medium">Manufacturing</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300" href="#">
<span className="material-symbols-outlined">analytics</span>
<span className="text-[0.875rem]">Analytics</span>
</a>
</nav>
<div className="mt-auto p-4 bg-white/40 rounded-xl">
<div className="flex items-center gap-3 mb-2">
<span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#57fae9]"></span>
<span className="text-[0.6875rem] uppercase font-bold text-slate-700">Line Active</span>
</div>
<p className="text-[0.75rem] text-slate-500">Efficiency: 98.4%</p>
</div>
</aside>

<main className="ml-72 pt-28 px-10 pb-10">

<header className="mb-10 flex justify-between items-end">
<div>
<h1 className="text-[1.75rem] font-bold tracking-tight text-on-surface mb-1">Manufacturing WIP</h1>
<p className="text-slate-500">Active Pipeline Monitoring &amp; Batch Management</p>
</div>
<div className="flex gap-4">
<button className="bg-surface-container-high text-on-surface px-8 py-3 rounded-xl font-medium hover:brightness-105 transition-all">
                    Pipeline Config
                </button>
<button className="bg-primary text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                    Start New Batch
                </button>
</div>
</header>
<div className="grid grid-cols-12 gap-6">

<section className="col-span-12 lg:col-span-8 h-[450px] relative overflow-hidden rounded-xl bg-surface-container-low flex items-center justify-center p-12">

<div className="absolute inset-0 opacity-10" ></div>

<div className="relative w-full flex items-center justify-between">

<div className="relative z-10 flex flex-col items-center">
<div className="w-24 h-24 rounded-full glass-panel border border-white/50 flex items-center justify-center shadow-xl mb-4 group cursor-pointer hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-primary text-3xl">deployed_code</span>
</div>
<span className="text-[0.6875rem] uppercase font-bold tracking-widest text-slate-500">Raw Materials</span>
</div>

<div className="flex-1 h-3 bg-white/50 rounded-full mx-[-12px] relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 animate-pulse"></div>

<div className="absolute top-1/2 -translate-y-1/2 w-4 h-1 bg-white rounded-full blur-[1px] left-1/4"></div>
<div className="absolute top-1/2 -translate-y-1/2 w-3 h-1 bg-white rounded-full blur-[1px] left-1/2"></div>
<div className="absolute top-1/2 -translate-y-1/2 w-2 h-1 bg-white rounded-full blur-[1px] left-3/4"></div>
</div>

<div className="relative z-10 flex flex-col items-center">
<div className="w-40 h-40 rounded-full glass-panel border-4 border-primary/20 flex flex-col items-center justify-center shadow-2xl mb-4 relative overflow-hidden">

<div className="absolute inset-0 bg-primary/5"></div>

<span className="material-symbols-outlined text-primary text-5xl mb-2">settings</span>
<span className="text-xs font-bold text-primary">BATCH #4920</span>
<div className="mt-2 px-3 py-1 bg-secondary/20 rounded-full">
<span className="text-[0.6rem] font-bold text-secondary uppercase">Processing</span>
</div>
</div>
<span className="text-[0.6875rem] uppercase font-bold tracking-widest text-slate-500">Process Unit 01</span>
</div>

<div className="flex-1 h-3 bg-white/50 rounded-full mx-[-12px] relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-tertiary/40 to-primary/40 opacity-50"></div>
</div>

<div className="relative z-10 flex flex-col items-center">
<div className="w-24 h-24 rounded-full glass-panel border border-white/50 flex items-center justify-center shadow-xl mb-4 opacity-60">
<span className="material-symbols-outlined text-slate-400 text-3xl">inventory_2</span>
</div>
<span className="text-[0.6875rem] uppercase font-bold tracking-widest text-slate-500">Final Output</span>
</div>
</div>

<div className="absolute bottom-8 right-8 flex gap-4">
<div className="glass-panel px-4 py-3 rounded-2xl border border-white/30 shadow-lg">
<p className="text-[0.6rem] uppercase text-slate-500 font-bold">Pressure</p>
<p className="text-lg font-bold text-on-surface">14.2 <span className="text-xs font-normal opacity-60">psi</span></p>
</div>
<div className="glass-panel px-4 py-3 rounded-2xl border border-white/30 shadow-lg">
<p className="text-[0.6rem] uppercase text-slate-500 font-bold">Temp</p>
<p className="text-lg font-bold text-on-surface">72.0 <span className="text-xs font-normal opacity-60">°C</span></p>
</div>
</div>
</section>

<aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">

<div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] relative overflow-hidden group">
<div className="absolute top-0 right-0 p-4">
<span className="material-symbols-outlined text-tertiary opacity-20 text-6xl rotate-12">receipt_long</span>
</div>
<div className="relative">
<h3 className="text-xl font-bold text-on-surface mb-6">Current Batch #4920</h3>
<div className="space-y-6">
<div>
<label className="text-[0.6875rem] uppercase font-bold text-slate-400 tracking-wider block mb-2">Materials</label>
<ul className="space-y-3">
<li className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl">
<span className="text-sm font-medium">Titanium Alloy 7X</span>
<span className="text-xs text-primary font-bold">120 kg</span>
</li>
<li className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl">
<span className="text-sm font-medium">Silicon Carbide</span>
<span className="text-xs text-primary font-bold">45 kg</span>
</li>
<li className="flex justify-between items-center bg-surface-container-low p-3 rounded-xl">
<span className="text-sm font-medium">Coolant Grade A</span>
<span className="text-xs text-primary font-bold">12 L</span>
</li>
</ul>
</div>
<div className="flex justify-between items-center border-t border-slate-100 pt-6">
<div>
<label className="text-[0.6875rem] uppercase font-bold text-slate-400 tracking-wider block">Expected Output</label>
<p className="text-lg font-bold">160 Units <span className="text-xs font-normal text-slate-500">Grade A+</span></p>
</div>
<div className="text-right">
<label className="text-[0.6875rem] uppercase font-bold text-slate-400 tracking-wider block">ETA</label>
<p className="text-lg font-bold text-primary">12:45 PM</p>
</div>
</div>
<div className="grid grid-cols-2 gap-4 pt-4">
<button className="flex items-center justify-center gap-2 bg-surface-container-high px-4 py-4 rounded-xl text-sm font-bold hover:bg-surface-variant transition-colors group">
<span className="material-symbols-outlined text-sm">pause</span>
                                    Pause
                                </button>
<button className="flex items-center justify-center gap-2 bg-secondary text-white px-4 py-4 rounded-xl text-sm font-bold shadow-lg shadow-secondary/20 hover:brightness-110 transition-all">
<span className="material-symbols-outlined text-sm">check_circle</span>
                                    Complete
                                </button>
</div>
</div>
</div>
</div>

<div className="bg-tertiary-container p-6 rounded-xl text-white relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
<div className="flex items-start gap-4">
<span className="material-symbols-outlined bg-white/20 p-2 rounded-lg">psychology</span>
<div>
<h4 className="font-bold text-sm mb-1">AI Optimization Recommendation</h4>
<p className="text-xs text-white/80 leading-relaxed mb-4">Batch efficiency could be increased by 4.2% if pressure is lowered to 13.8 psi for the final 10 minutes of cooling.</p>
<button className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-[0.6875rem] font-bold transition-colors">Apply Optimization</button>
</div>
</div>
</div>
</aside>

<section className="col-span-12">
<div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_20px_40px_rgba(0,87,194,0.06)]">
<div className="px-8 py-6 flex justify-between items-center border-b border-surface-container-low">
<h3 className="font-bold text-lg">Production Log</h3>
<div className="flex gap-2">
<span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[0.6875rem] font-bold uppercase">Today</span>
<span className="px-3 py-1 hover:bg-slate-50 text-slate-400 rounded-full text-[0.6875rem] font-bold uppercase cursor-pointer">Archive</span>
</div>
</div>
<table className="w-full text-left">
<thead>
<tr className="text-[0.6875rem] uppercase text-slate-400 font-bold tracking-widest">
<th className="px-8 py-4">Batch ID</th>
<th className="px-8 py-4">Status</th>
<th className="px-8 py-4">Start Time</th>
<th className="px-8 py-4">Efficiency</th>
<th className="px-8 py-4">Operator</th>
<th className="px-8 py-4 text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container-low">
<tr className="hover:bg-slate-50/50 transition-colors">
<td className="px-8 py-4 font-medium">#4920</td>
<td className="px-8 py-4">
<span className="flex items-center gap-2 text-secondary font-bold text-xs uppercase">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                                        In Progress
                                    </span>
</td>
<td className="px-8 py-4 text-sm text-slate-600">09:15 AM</td>
<td className="px-8 py-4">
<div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
<div className="bg-secondary h-full w-[98%]"></div>
</div>
</td>
<td className="px-8 py-4 flex items-center gap-3">
<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[0.6rem] font-bold text-blue-700">JS</div>
<span className="text-sm">John Sterling</span>
</td>
<td className="px-8 py-4 text-right">
<button className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">more_horiz</button>
</td>
</tr>
<tr className="hover:bg-slate-50/50 transition-colors">
<td className="px-8 py-4 font-medium">#4919</td>
<td className="px-8 py-4">
<span className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                                        Completed
                                    </span>
</td>
<td className="px-8 py-4 text-sm text-slate-600">08:00 AM</td>
<td className="px-8 py-4">
<div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
<div className="bg-primary h-full w-[94%]"></div>
</div>
</td>
<td className="px-8 py-4 flex items-center gap-3">
<div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[0.6rem] font-bold text-purple-700">MK</div>
<span className="text-sm">Maria K.</span>
</td>
<td className="px-8 py-4 text-right">
<button className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">more_horiz</button>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>

<div className="fixed bottom-10 right-10">
<button className="w-16 h-16 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
<span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
</button>
</div>

    </>
  );
}
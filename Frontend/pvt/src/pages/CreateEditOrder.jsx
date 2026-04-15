
export default function CreateEditOrder() {
  return (
    <>
      

<nav className="hidden md:flex flex-col h-full py-6 bg-slate-50 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0">
<div className="px-6 mb-8">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
<img alt="Organization Logo" className="w-8 h-8 rounded-md" data-alt="minimalist geometric logo for a high-tech logistics company with blue and white accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn_KbMgXezvNLlS80SRtcd-lK3Q0CvK21MAnkIMfJ0qfu1zctOV2AnpTD9MEOaEO3QOo63KeL_A0Y4__TyOfLLNyn0o17BU1D1ijiw4e6FrE_shqkjVwmvHhnQM7orl-QQxQkrHHKbB8T__tSm_UarT7wunyTtmmsFcbZFGngFrhheuqTdi5XDLH9ajKfTxUz1dnROga47R2Rhc6c2wZqo_uDrQp38GYGnyp7zuQM2ghzbtcDgO0fAZbvJWaHq0m1b7-pW0xK9BCbn"/>
</div>
<div>
<h1 className="text-lg font-black text-slate-900 dark:text-white">Global Ops</h1>
<p className="text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold">Enterprise Tier</p>
</div>
</div>
</div>
<div className="flex-1 px-4 space-y-2">
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="text-sm font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-700 dark:text-blue-400 font-semibold border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="text-sm font-medium">Orders</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="text-sm font-medium">Customers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="factory">factory</span>
<span className="text-sm font-medium">Suppliers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="local_shipping">local_shipping</span>
<span className="text-sm font-medium">Logistics</span>
</a>
</div>
<div className="px-4 py-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 transition-all" href="#">
<span className="material-symbols-outlined" data-icon="help">help</span>
<span className="text-sm font-medium">Support</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-blue-600 transition-all" href="#">
<span className="material-symbols-outlined" data-icon="archive">archive</span>
<span className="text-sm font-medium">Archive</span>
</a>
</div>
</nav>

<main className="md:ml-64 min-h-screen">

<header className="flex justify-between items-center px-8 py-4 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl docked full-width top-0 sticky z-50 transition-all">
<div className="flex items-center gap-8">
<h2 className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Luminous OS</h2>
<nav className="hidden lg:flex gap-6">
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Inventory</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Reports</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<button className="p-2 rounded-full hover:bg-blue-50/50 transition-all text-slate-600">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="p-2 rounded-full hover:bg-blue-50/50 transition-all text-slate-600">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ml-2 border-2 border-white shadow-sm">
<img alt="User profile" data-alt="professional portrait of a project manager in a bright office environment, smiling calmly" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASrCHrIh6V2tfgbtSx54VKRX0YfQaAEMY4BbUJ_pOB8E8nXYaKC_a0OnkMkIvo8OiCzoDcuaO-ISMTVGwL7LAdtV2pyliZd5xd8vAK0s9RTpJdIkOazAYwyd-8A469f2vEgRBVPncGZUuVI1Cp_6sKQx6KLXh1JkALMjTjzBV3YTCxpu1oDrwr3kEHcJ-3zXN4qnh8-iYvL0SGftZ9woA0HMcS6S5ZOIUZQxMvuIDbN8ZIXH1rTUAez7WKhgDvh41ddFowlZwPIY2H"/>
</div>
</div>
</header>

<div className="max-w-[1400px] mx-auto p-8 lg:p-12">

<div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<span className="text-[0.6875rem] uppercase tracking-widest text-primary font-bold mb-2 block">Order Management</span>
<h1 className="text-4xl lg:text-5xl font-black tracking-tight text-on-surface">Create New Order</h1>
</div>
<div className="flex gap-4">
<button className="px-6 py-3 rounded-xl bg-surface-container-highest text-on-surface font-semibold hover:bg-surface-container-high transition-all active:scale-[0.98]">
                        Save Draft
                    </button>
<button className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center gap-2">
<span>Initialize Workflow</span>
<span className="material-symbols-outlined text-lg" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

<div className="lg:col-span-12">
<div className="glass-panel rounded-xl p-8 shadow-sm border border-outline-variant/15 flex flex-col md:flex-row gap-8 items-center">
<div className="w-full flex-1">
<label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Entity Selection</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" data-icon="person_search">person_search</span>
<input className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-container-lowest border-none shadow-sm text-lg focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400" placeholder="Enter Customer or Supplier ID (e.g. CUST-882, SUPP-101)..." type="text" value="TECH-INF-772 - Lumina Tech Solutions"/>
</div>
</div>
<div className="flex gap-4 w-full md:w-auto">
<div className="flex-1 md:w-48">
<label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Reference No.</label>
<input className="w-full px-4 py-4 rounded-xl bg-surface-container-low border-none text-slate-600 font-mono text-sm" readonly="" type="text" value="#ORD-2024-991"/>
</div>
<div className="flex-1 md:w-48">
<label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Date</label>
<input className="w-full px-4 py-4 rounded-xl bg-surface-container-lowest border-none shadow-sm focus:ring-2 focus:ring-primary/20" type="date" value="2024-10-27"/>
</div>
</div>
</div>
</div>

<div className="lg:col-span-8">
<div className="bg-surface-container-lowest rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] overflow-hidden">
<div className="px-8 py-6 border-b border-surface-container flex justify-between items-center bg-white">
<h3 className="text-xl font-bold text-on-surface">Order Line Items</h3>
<div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
<span className="material-symbols-outlined text-lg" data-icon="view_list">view_list</span>
<span>Displaying 4 of 102 items</span>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low">
<th className="px-8 py-4 text-[0.6875rem] font-black uppercase tracking-widest text-slate-500">Code</th>
<th className="px-4 py-4 text-[0.6875rem] font-black uppercase tracking-widest text-slate-500">Product Name</th>
<th className="px-4 py-4 text-[0.6875rem] font-black uppercase tracking-widest text-slate-500 text-center">Qty</th>
<th className="px-4 py-4 text-[0.6875rem] font-black uppercase tracking-widest text-slate-500 text-right">Price</th>
<th className="px-8 py-4 text-[0.6875rem] font-black uppercase tracking-widest text-slate-500 text-right">Total</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container">

<tr className="hover:bg-blue-50/20 transition-colors group">
<td className="px-8 py-6 text-sm font-mono text-primary font-semibold">PRD-X922</td>
<td className="px-4 py-6">
<div className="text-sm font-bold text-on-surface">Quantum Core Processor</div>
<div className="text-[0.6875rem] text-slate-400">Hardware / Internal</div>
</td>
<td className="px-4 py-6">
<div className="flex items-center justify-center gap-3">
<input className="w-16 text-center border-none bg-surface-container-low rounded-lg py-1 text-sm font-bold focus:ring-2 focus:ring-primary/20" type="number" value="12"/>
</div>
</td>
<td className="px-4 py-6 text-right text-sm font-medium">$420.00</td>
<td className="px-8 py-6 text-right text-sm font-bold">$5,040.00</td>
</tr>

<tr className="hover:bg-blue-50/20 transition-colors group">
<td className="px-8 py-6 text-sm font-mono text-primary font-semibold">PRD-Z104</td>
<td className="px-4 py-6">
<div className="text-sm font-bold text-on-surface">OLED Display Matrix 27"</div>
<div className="text-[0.6875rem] text-slate-400">Hardware / Peripheral</div>
</td>
<td className="px-4 py-6">
<div className="flex items-center justify-center gap-3">
<input className="w-16 text-center border-none bg-surface-container-low rounded-lg py-1 text-sm font-bold focus:ring-2 focus:ring-primary/20" type="number" value="5"/>
</div>
</td>
<td className="px-4 py-6 text-right text-sm font-medium">$890.00</td>
<td className="px-8 py-6 text-right text-sm font-bold">$4,450.00</td>
</tr>

<tr className="hover:bg-blue-50/20 transition-colors group">
<td className="px-8 py-6 text-sm font-mono text-primary font-semibold">SRV-ENT-01</td>
<td className="px-4 py-6">
<div className="text-sm font-bold text-on-surface">Enterprise Cloud Setup</div>
<div className="text-[0.6875rem] text-slate-400">Service / Infrastructure</div>
</td>
<td className="px-4 py-6">
<div className="flex items-center justify-center gap-3">
<input className="w-16 text-center border-none bg-surface-container-low rounded-lg py-1 text-sm font-bold focus:ring-2 focus:ring-primary/20" type="number" value="1"/>
</div>
</td>
<td className="px-4 py-6 text-right text-sm font-medium">$12,500.00</td>
<td className="px-8 py-6 text-right text-sm font-bold">$12,500.00</td>
</tr>
</tbody>
</table>
</div>
<div className="p-8 bg-surface-container-low flex justify-center">
<button className="flex items-center gap-2 text-primary font-bold hover:scale-105 transition-transform">
<span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
<span>Add New Product Row</span>
</button>
</div>
</div>
</div>

<div className="lg:col-span-4 space-y-6">
<div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border-l-4 border-primary">
<h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Financial Summary</h3>
<div className="space-y-4">
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Subtotal</span>
<span className="font-bold text-on-surface">$21,990.00</span>
</div>
<div className="flex justify-between items-center text-sm">
<span className="text-slate-500">Tax (Vat 15%)</span>
<span className="font-bold text-on-surface">$3,298.50</span>
</div>
<div className="flex justify-between items-center text-sm text-secondary font-medium">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-base" data-icon="auto_awesome">auto_awesome</span>
                                    Enterprise Discount
                                </span>
<span>-$2,199.00</span>
</div>
<div className="pt-6 mt-2 border-t border-surface-container-highest flex justify-between items-end">
<div>
<span className="text-xs font-bold uppercase text-slate-400 block mb-1">Grand Total</span>
<span className="text-3xl font-black text-primary">$23,089.50</span>
</div>
<div className="text-right">
<span className="text-[10px] font-bold text-slate-400 block uppercase">USD</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-low rounded-xl p-6">
<h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Automation Logic</h3>
<div className="flex items-start gap-4 mb-4">
<div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-lg" data-icon="psychology">psychology</span>
</div>
<div>
<p className="text-xs font-bold text-on-surface">AI Optimizer Active</p>
<p className="text-[11px] text-slate-500 leading-relaxed mt-1">Route fulfillment via East Coast warehouse to save $120.50 in logistics.</p>
</div>
</div>
<div className="flex items-start gap-4">
<div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-lg" data-icon="inventory_2">inventory_2</span>
</div>
<div>
<p className="text-xs font-bold text-on-surface">Stock Availability</p>
<p className="text-[11px] text-slate-500 leading-relaxed mt-1">All items in stock. Shipping ETA: 48 hours.</p>
</div>
</div>
</div>

<div className="grid grid-cols-2 gap-4">
<button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white hover:bg-blue-50 transition-all border border-outline-variant/10 text-slate-600">
<span className="material-symbols-outlined" data-icon="print">print</span>
<span className="text-xs font-bold">Print Proforma</span>
</button>
<button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white hover:bg-blue-50 transition-all border border-outline-variant/10 text-slate-600">
<span className="material-symbols-outlined" data-icon="mail">mail</span>
<span className="text-xs font-bold">Share PDF</span>
</button>
</div>
</div>
</div>
</div>
</main>

<div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
<div className="glass-panel px-6 py-4 rounded-full shadow-[0px_20px_40px_rgba(0,87,194,0.12)] flex items-center gap-4 min-w-[320px] md:min-w-[500px] border border-white/50">
<span className="material-symbols-outlined text-primary" data-icon="bolt" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
<input className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full placeholder:text-slate-400" placeholder="Quick find product (Alt + Q)..." type="text"/>
<div className="flex items-center gap-1 bg-slate-200/50 px-2 py-1 rounded text-[10px] font-bold text-slate-500">
<span>ALT</span>
<span>+</span>
<span>Q</span>
</div>
</div>
</div>

    </>
  );
}

export default function Customers() {
  return (
    <>
      

<aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col h-full py-6 z-40">
<div className="px-6 mb-8">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center overflow-hidden">
<img alt="Organization Logo" data-alt="minimalist geometric logo for a global enterprise software company using shades of electric blue and white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhlndjSC_sMMepMDCAcdca31eB6KCER1gNxcZbcIV6T-STMcwYopScp2IzsKrnSnhVZ5RQZsQuS2zzyBbz_b6sRt73dMU_66KP4C0Fb0H3mVJTHAkEqG3H5okzmVMFCridOITGnMT-Nr2Iu4uMdQ1FsNF-F-uwCJyRqmJTkHj8iYNaTDSKElw6SVFonHwYxzvx-A9Vu05S71BzW4k14k1ghRWR7N7II44g8XWKG5IYGoyQOCqYnxJN_84Tc54ujGCQ_a6q2itmq35U"/>
</div>
<div>
<h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Global Ops</h1>
<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Enterprise Tier</p>
</div>
</div>
</div>
<nav className="flex-1 space-y-1 px-4">

<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="text-sm font-medium">Dashboard</span>
</a>

<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="text-sm font-medium">Orders</span>
</a>

<a className="flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 translate-x-1" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="text-sm">Customers</span>
</a>

<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="factory">factory</span>
<span className="text-sm font-medium">Suppliers</span>
</a>

<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined" data-icon="local_shipping">local_shipping</span>
<span className="text-sm font-medium">Logistics</span>
</a>
</nav>
<div className="px-6 mt-auto">
<button className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
<span className="material-symbols-outlined text-sm" data-icon="add">add</span>
<span>New Entry</span>
</button>
<div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
<a className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm hover:text-blue-600" href="#">
<span className="material-symbols-outlined text-[20px]" data-icon="help">help</span>
<span>Support</span>
</a>
<a className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm hover:text-blue-600" href="#">
<span className="material-symbols-outlined text-[20px]" data-icon="archive">archive</span>
<span>Archive</span>
</a>
</div>
</div>
</aside>

<main className="ml-64 min-h-screen">

<header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl text-slate-900 dark:text-white sticky top-0 z-30 flex justify-between items-center px-8 py-4 w-full">
<div className="flex items-center gap-8">
<span className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Luminous OS</span>
<nav className="hidden md:flex gap-6">
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Inventory</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Reports</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-3 py-1 rounded-lg transition-all" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" data-icon="search">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Global Search..." type="text"/>
</div>
<button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50/50 transition-all">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-50/50 transition-all">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
<img alt="User profile" data-alt="professional portrait of a tech executive in a brightly lit modern office setting with soft depth of field" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdY9w7GVa9h9peBgJaYjpoC3fBoviKXkORvpFpj_YHrjxj72PTpSRck4TKE1A0gxkYYytjLUNrWEx0Bhd-TmuCwXZA0KK2MH-DL7girlgzhqlbEg64Q5GWnBhGonjsNZ55R4DmDV-SnvNhfu2xJaRuKZ8goR-94q4VxwC5mzCodELB9uILULmtBZfh2OeVlc6N2Ij2xf3MPUqs_CK0QyRfm3v3Qi_p_Rx5o2xXT6FDQz0UHqYYGakSzLRxsxODmwDd38HU5PHpeBnB"/>
</div>
</div>
</header>

<div className="p-8 flex gap-8 h-[calc(100vh-80px)]">

<section className="w-1/3 flex flex-col gap-6">
<div className="flex justify-between items-end">
<div>
<h2 className="text-2xl font-bold tracking-tight text-on-surface">Entity Directory</h2>
<p className="text-sm text-on-surface-variant font-medium">34 Active Customers &amp; Suppliers</p>
</div>
</div>
<div className="relative">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary" data-icon="filter_list">filter_list</span>
<input className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest shadow-sm rounded-xl border-none focus:ring-2 focus:ring-primary/10 transition-all" placeholder="Search by name, ID, or location..." type="text"/>
</div>

<div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">

<div className="p-4 bg-surface-container-lowest rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] border-l-4 border-primary group cursor-pointer hover:scale-[1.01] transition-all">
<div className="flex justify-between items-start mb-2">
<div>
<p className="text-[10px] font-black text-primary tracking-widest uppercase">Customer</p>
<h3 className="font-bold text-on-surface">Stellar Dynamics Corp</h3>
</div>
<span className="text-[10px] font-mono px-2 py-1 bg-primary-fixed rounded text-on-primary-fixed">ID: ENT-9042</span>
</div>
<div className="flex items-center gap-3 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="mail">mail</span>
<p className="text-sm font-medium">procurement@stellar.io</p>
</div>
</div>

<div className="p-4 bg-surface-container-low hover:bg-surface-container-lowest rounded-xl transition-all cursor-pointer group hover:shadow-sm">
<div className="flex justify-between items-start mb-2">
<div>
<p className="text-[10px] font-black text-secondary tracking-widest uppercase">Supplier</p>
<h3 className="font-bold text-on-surface">Nexus Logistics Hub</h3>
</div>
<span className="text-[10px] font-mono px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant">ID: ENT-8812</span>
</div>
<div className="flex items-center gap-3 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="phone">phone</span>
<p className="text-sm font-medium">+1 (555) 012-9988</p>
</div>
</div>
<div className="p-4 bg-surface-container-low hover:bg-surface-container-lowest rounded-xl transition-all cursor-pointer group hover:shadow-sm">
<div className="flex justify-between items-start mb-2">
<div>
<p className="text-[10px] font-black text-primary tracking-widest uppercase">Customer</p>
<h3 className="font-bold text-on-surface">Quantize Research</h3>
</div>
<span className="text-[10px] font-mono px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant">ID: ENT-7741</span>
</div>
<div className="flex items-center gap-3 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="mail">mail</span>
<p className="text-sm font-medium">ops@quantize.org</p>
</div>
</div>
<div className="p-4 bg-surface-container-low hover:bg-surface-container-lowest rounded-xl transition-all cursor-pointer group hover:shadow-sm">
<div className="flex justify-between items-start mb-2">
<div>
<p className="text-[10px] font-black text-secondary tracking-widest uppercase">Supplier</p>
<h3 className="font-bold text-on-surface">Aurora Micro-Chips</h3>
</div>
<span className="text-[10px] font-mono px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant">ID: ENT-6623</span>
</div>
<div className="flex items-center gap-3 text-on-surface-variant">
<span className="material-symbols-outlined text-sm" data-icon="call">call</span>
<p className="text-sm font-medium">+49 89 223 4455</p>
</div>
</div>
</div>
</section>

<section className="flex-1">
<div className="h-full glass-panel rounded-xl overflow-hidden relative shadow-[0px_40px_80px_rgba(0,0,0,0.05)] flex flex-col">

<div className="relative h-48 w-full bg-primary-container overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-tertiary/60 mix-blend-multiply"></div>
<img alt="Entity banner" className="w-full h-full object-cover opacity-40" data-alt="ultra-modern glass and steel skyscraper atrium with high-end architectural details and natural sunlight streaming through panels" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxz0bEaWzgIKP8xODGzb_uLjGQDkPdKG0eTMd8e0h2_qnW3DHjzrEMQEGwI-sDYlJAx-1YTbvR3Z2WA7lAc48GZXYWN4YCBRyGvGBeYL4cQXT_aBKRchJIuzX3i1lbOFSTFmpJlI_IN3aFyfUIA9q0s7p8Z3cUg1TM6LXWJzibdfBw4K-xNJPYrJNBXlx4I456NgD67FsfXnjbcYA23kD6yZFxqC4ZQfQXfea1WSklI5kH7MlP40ckrbEoCcfW_9JV943xwU-YlE9A"/>
<div className="absolute bottom-6 left-8 flex items-end gap-6">
<div className="w-24 h-24 rounded-xl bg-white p-1 shadow-xl">
<img alt="Stellar Logo" className="w-full h-full rounded-lg object-cover" data-alt="clean vector logo for a space technology company featuring abstract orbital rings in deep blue" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs9aVUSbTy0o6lxu41gthNAYfuLfjGnCx-JJoazEQK0XiUwBhjm0xRuiAKNuFpIPaeBDvmQndwJfzTo_AlX96nOAczU_wF1avYj3VQR3Q8FYTgDsP4EUq21w-MBhT7Fzhb7qkmr7P65Kt6ueqwLj6ndczvfxqWFPuP6Mkx9bCfi7D8MTQtGfvZHotcjMycXDjFdjzCtluC5YbyT_bBunnNK8jJouoHFMDLTlZnRvkC_XMzhEtXQDanQnCrSjiEQ4jAQNOM0W_O68_G"/>
</div>
<div className="pb-2">
<h2 className="text-4xl font-black text-white tracking-tighter">Stellar Dynamics Corp</h2>
<p className="text-white/80 font-medium tracking-wide">Premium Partner • Since 2021</p>
</div>
</div>
<div className="absolute top-6 right-8 flex gap-3">
<button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all">
<span className="material-symbols-outlined" data-icon="edit">edit</span>
</button>
<button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-error hover:text-on-error transition-all">
<span className="material-symbols-outlined" data-icon="delete">delete</span>
</button>
</div>
</div>

<div className="flex-1 p-10 overflow-y-auto">
<div className="grid grid-cols-2 gap-12">

<div className="space-y-8">
<div className="space-y-1">
<label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Unique Identifier</label>
<p className="text-xl font-bold text-on-surface">ENT-9042-GLOBAL</p>
</div>
<div className="space-y-1">
<label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Direct Contact</label>
<div className="flex flex-col gap-3 mt-2">
<div className="flex items-center gap-3">
<span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-sm text-primary" data-icon="phone">phone</span>
</span>
<span className="font-medium">+1 (415) 555-0192</span>
</div>
<div className="flex items-center gap-3">
<span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
<span className="material-symbols-outlined text-sm text-primary" data-icon="alternate_email">alternate_email</span>
</span>
<span className="font-medium">procurement@stellar.io</span>
</div>
</div>
</div>
</div>

<div className="space-y-8">
<div className="space-y-1">
<label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Office Address</label>
<div className="flex items-start gap-3 mt-2">
<span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-sm text-primary" data-icon="location_on">location_on</span>
</span>
<p className="font-medium leading-relaxed">
                                            Level 42, Orbital Tower B<br/>
                                            Mission Bay, San Francisco<br/>
                                            CA 94158, United States
                                        </p>
</div>
</div>
<div className="space-y-1">
<label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Tag</label>
<div className="flex gap-2 mt-2">
<span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">High Growth</span>
<span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-xs font-bold">Auto-Billing</span>
</div>
</div>
</div>
</div>

<div className="mt-16 grid grid-cols-3 gap-6">
<div className="col-span-2 p-6 bg-surface-container-low rounded-xl border-l-2 border-primary">
<div className="flex items-center justify-between mb-4">
<h4 className="font-bold text-on-surface">Recent Transaction Flow</h4>
<span className="text-[10px] font-bold text-secondary">+12.4% vs Last Month</span>
</div>
<div className="h-24 w-full flex items-end gap-1">
<div className="flex-1 bg-primary/10 rounded-t-sm h-12"></div>
<div className="flex-1 bg-primary/10 rounded-t-sm h-16"></div>
<div className="flex-1 bg-primary/20 rounded-t-sm h-14"></div>
<div className="flex-1 bg-primary/40 rounded-t-sm h-20"></div>
<div className="flex-1 bg-primary/60 rounded-t-sm h-18"></div>
<div className="flex-1 bg-primary rounded-t-sm h-24"></div>
</div>
</div>
<div className="p-6 bg-tertiary-container text-on-tertiary-container rounded-xl flex flex-col justify-between">
<span className="material-symbols-outlined" data-icon="auto_awesome">auto_awesome</span>
<div>
<p className="text-2xl font-black">$4.2M</p>
<p className="text-xs font-medium opacity-80 uppercase tracking-wider">Lifetime Value</p>
</div>
</div>
</div>
</div>

<div className="p-6 flex justify-end gap-4 border-t border-outline-variant/10">
<button className="px-8 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all">
                            Export Profile
                        </button>
<button className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            Create New Order
                        </button>
</div>
</div>
</section>
</div>
</main>

<button className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
<span className="material-symbols-outlined text-3xl" data-icon="person_add">person_add</span>
</button>

    </>
  );
}
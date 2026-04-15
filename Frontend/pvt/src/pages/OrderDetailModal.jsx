
export default function OrderDetailModal() {
  return (
    <>
      

<div className="flex h-screen overflow-hidden">

<aside className="hidden md:flex flex-col h-full py-6 bg-slate-50 dark:bg-slate-950 w-64 fixed left-0 top-0 z-40 border-r-0">
<div className="px-6 mb-8 flex items-center gap-3">
<div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
</div>
<div>
<h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Global Ops</h1>
<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Enterprise Tier</p>
</div>
</div>
<nav className="flex-1 px-4 space-y-2">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform group" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="body-md font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" href="#">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
<span className="body-md">Orders</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined">group</span>
<span className="body-md">Customers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined">factory</span>
<span className="body-md">Suppliers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined">local_shipping</span>
<span className="body-md">Logistics</span>
</a>
</nav>
<div className="px-4 mt-auto pt-6 border-t border-slate-200/50">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors" href="#">
<span className="material-symbols-outlined">help</span>
<span className="body-md">Support</span>
</a>
<div className="mt-4 p-4 bg-primary-container/10 rounded-xl">
<button className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
<span className="material-symbols-outlined text-sm">add</span>
                        New Entry
                    </button>
</div>
</div>
</aside>

<main className="flex-1 ml-0 md:ml-64 bg-surface min-h-screen relative overflow-y-auto">

<header className="flex justify-between items-center px-8 py-4 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50">
<div className="flex items-center gap-8">
<span className="text-xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Luminous OS</span>
<nav className="hidden lg:flex items-center gap-6">
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 transition-all px-3 py-1 rounded-full" href="#">Inventory</a>
<a className="text-blue-700 dark:text-blue-400 font-bold border-b-2 border-blue-700 px-3 py-1" href="#">Reports</a>
<a className="text-slate-500 dark:text-slate-400 font-medium hover:bg-blue-50/50 transition-all px-3 py-1 rounded-full" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<div className="relative hidden sm:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
<input className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Quick search..." type="text"/>
</div>
<button className="p-2 text-slate-500 hover:bg-blue-50/50 rounded-full transition-all">
<span className="material-symbols-outlined">notifications</span>
</button>
<img alt="User profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" data-alt="Close up portrait of a professional man in a studio with soft overhead lighting and a clean neutral background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBE6LhSVfEFFHrUfwQfv3t5airiLCFxvkL0bpUVC1Tozs6Wv65fANJ2-mBcfDCUO0V0w28PaSuakwaHJdA9WI3lgjcTmJDIK6ll0HPPWWZb6ua2s8INU-9nbDUF8M5RCzUt3ffmxZUtf7pXhzN3EZX4DymRXJYlxEx_b7C-xoNcOuz4MTJplCT9yHRYDk9ojU_Qwzb6-6giHMM1qeOUtgsLANrfgYI7lfUOZ7H-Hj6p4dnWDY-an2NKHpy0EoULOGFqqYCiv7T5WeX"/>
</div>
</header>

<div className="p-8 space-y-8 opacity-40 select-none pointer-events-none">
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm h-40"></div>
<div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm h-40"></div>
<div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm h-40"></div>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm h-96 w-full"></div>
</div>

<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">

<div className="bg-surface-container-lowest w-full max-w-4xl max-h-[921px] rounded-xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

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
<button className="p-2 hover:bg-error-container text-error rounded-full transition-all ml-2">
<span className="material-symbols-outlined">close</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
<div className="flex gap-4 p-4 bg-surface-container-low rounded-lg items-center">
<div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-outline-variant/30 flex-shrink-0">
<img alt="Organization Logo" className="w-full h-full object-cover" data-alt="Abstract minimalist company logo featuring geometric shapes in shades of blue and white on a clean background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhAP0Xym4kqnxfuqnW0fvrZMNVU-EJ7XhAoZDk4t3lhtTN6CWxzpyJ1vLya3aTho6shUgi9LYU13u7uR6zDZ3NyZjnrjqwgx_ZwBDhDBDyl5ti_X05gs2SHhmvzogoCeRpI0XBdj-IAx4NHcGWRuXITkj3SUYcEBawv1xu0rYXn2GVmGqzhWREHWHBoGio5Uob9vwvn5pjTHAVS6H1bC5t-l_KrAv_SEUbWlLLObNkpsAzGHLiDxuSSJgi7ZVu4_i4OlysS5yens70"/>
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

<div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2">
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
<div className="w-10 h-10 rounded-lg bg-white p-1 border border-outline-variant/20">
<img alt="Product" className="w-full h-full object-cover rounded-md" data-alt="Sleek modern electronic component with copper circuits and metallic finish on a white background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDV-xPiyGfclgALS03Kt6UoM4jOsOadI3sSQNGIlp5kN99JT7VYJ5juiJ6Q7feWAoRXFcdMuQysgSqZjc72M3MQtokQeoHiaPrBpfLPZ6Smf38odwvPms1S8-83agXDkb3hM75Sga3-YL4ydOeXJtsDZywxDR2nry79wFLengUx7-siB8tq_1jTVrXZXJZQvy0fsy59Nxuhu5yt8BmI_2jC1BIqwK6i6vMGQ7orx9FpmL1_KYH5omYZJf6HImtx81eeE8E_j0QwlTfK"/>
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
<div className="w-10 h-10 rounded-lg bg-white p-1 border border-outline-variant/20">
<img alt="Product" className="w-full h-full object-cover rounded-md" data-alt="Abstract 3D rendered technological object with neon blue accents and geometric patterns" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQkwNQkQB-fbu9Kwpc8q87Sv4_1nvryERQNzwOCw5Fa8JnpoopAdFw7t2DjvV6_aJ9YEJJLbwogcozqUdKMcziHxOpQYZ4-HdAPcLBM6QUAmD1mj5_rVgJgsTI9vP2Qy0KuFHOAebM5_R-VtZYi6R2PYbt0fS-tlZB1e9PGdIm1NrmOdQuMhEJxkEolZCUc0OcJjjoGdUCVdQPyP0REIEY1TVfkJqlRqEiD9GVM7GViujqqWEIsxId9rYAjGF_jmAjzxrS_sNUDRUQ"/>
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
<div className="w-10 h-10 rounded-lg bg-white p-1 border border-outline-variant/20">
<img alt="Product" className="w-full h-full object-cover rounded-md" data-alt="Close up of braided high-tech cabling with metallic connectors in a bright laboratory setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBhqMLLXRq3uy2g9zA_ZMpqjnM-oWfExi9LwJQdi0WDHC6VdP0Nu16O8t1lZLJIm8ymD04V_HXXpm3kjRLhAymxwTI-zN5tsOMUesuEZsNeFZMSbpGoa7lOA2v2IuWDfODrtKj3_HA29Rk195c74Zv8RPm8mXD_wvy7KbfHH8MFTmB8fFr5cgI2JlvMIfStpikratHd-pqPFa1tPC6tpUSUuJT4FzWVryD7N21s8zrRGSGUHdNbh_Q5iuG9Ki6wrkKIkGMBLjXUxxt"/>
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
<div className="w-10 h-10 rounded-lg bg-white p-1 border border-outline-variant/20">
<img alt="Product" className="w-full h-full object-cover rounded-md" data-alt="Digital representation of blockchain data blocks floating in a network with neon glowing nodes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQu-C6UFDOeCi1_1yR95JwKZt2h4oMhUGO0mmVoKzE3r_9Zj2Y2YvbElde9F47h3ORMPtK2hApwy8fG6E1_XaaoA3UYSxjeI_NoRFZ05cFEjbB0fMtcMC71_17JZ1ITopnhvCZmcHkNvz-tj7VmAnsepU3SBLqRnGAtEaddbip0_xAk9kJP2U5itzwXDCeq2w0Y86Vsrc4KMa0QLiKbvBsy-_o-0PbuoUwwYyGjPaVUKMqXfjmC6SRuH0XwONIiAotfao31fUuGlg4"/>
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

<div className="p-8 bg-surface-container-low/50 border-t-0 flex flex-col sm:flex-row justify-between items-center gap-6">
<div className="flex flex-col items-start gap-1">
<p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Invoice Amount</p>
<p className="text-3xl font-black text-on-surface">$9,261.50</p>
</div>
<div className="flex items-center gap-3 w-full sm:w-auto">
<button className="flex-1 sm:flex-none px-6 py-3 bg-surface-container-highest text-on-surface-variant rounded-xl font-bold text-sm hover:bg-outline-variant/30 transition-all active:scale-95">
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
</main>
</div>

<nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t-0 z-50 flex justify-around items-center px-4 py-3 shadow-[0px_-10px_40px_rgba(0,0,0,0.05)]">
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined">dashboard</span>
<span className="text-[10px] font-bold">Home</span>
</button>
<button className="flex flex-col items-center gap-1 text-blue-700">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
<span className="text-[10px] font-bold">Orders</span>
</button>
<div className="-mt-8 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-surface">
<span className="material-symbols-outlined text-white">add</span>
</div>
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined">analytics</span>
<span className="text-[10px] font-bold">Data</span>
</button>
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined">account_circle</span>
<span className="text-[10px] font-bold">Profile</span>
</button>
</nav>

    </>
  );
}
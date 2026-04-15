
export default function NotificationPanel() {
  return (
    <>
      

<main className="flex h-screen w-full">


<div className="ml-64 flex-1 overflow-y-auto">

<header className="bg-white/70 backdrop-blur-xl sticky top-0 z-40 flex justify-between items-center px-8 py-4 w-full">
<div className="flex items-center gap-12">
<div className="text-xl font-bold tracking-tight text-blue-700">Luminous OS</div>
<nav className="hidden md:flex gap-8">
<a className="text-slate-500 font-medium hover:bg-blue-50/50 px-3 py-1 rounded transition-all" href="#">Inventory</a>
<a className="text-slate-500 font-medium hover:bg-blue-50/50 px-3 py-1 rounded transition-all" href="#">Reports</a>
<a className="text-slate-500 font-medium hover:bg-blue-50/50 px-3 py-1 rounded transition-all" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50/50 transition-all relative">
<span className="material-symbols-outlined text-slate-600" data-icon="notifications">notifications</span>
<span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50/50 transition-all">
<span className="material-symbols-outlined text-slate-600" data-icon="settings">settings</span>
</button>
<img alt="User profile" className="w-10 h-10 rounded-full object-cover" data-alt="Close-up portrait of a professional male manager in a bright modern office setting with soft natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEY2gXpE5oACU-lsI4mUqaq0cGNR_8x-vdWHQDN8cfxubCtBXLqbqptn0qxkrHyhsJUpseCmqKpQrcewFuYzePQFkD-e5r4RT9_-btUlRQ_XddjLJX_1KXjvUtXLlkwiNZxnpuXXn2nSQqrIvOJQnJQ6oTeu_uTsxly0a7lZUSTQlAFTQd45qG9NTFkDX6F3XiI_VgwBtwneZm9x4hetk9DPWMl7q1Ai-nuMIvv2z5uQz5ecd0oSET2EPusFSSWQ4-oihiImBVvPux"/>
</div>
</header>

<div className="p-10 space-y-10">
<div className="grid grid-cols-3 gap-8">
<div className="bg-surface-container-low p-8 rounded-xl space-y-2">
<p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500">Active Shipments</p>
<h2 className="text-5xl font-extrabold text-on-surface tracking-tighter italic">1,284</h2>
<div className="text-secondary font-semibold text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
              12% vs last month
            </div>
</div>
<div className="bg-surface-container-low p-8 rounded-xl space-y-2">
<p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500">Production Rate</p>
<h2 className="text-5xl font-extrabold text-on-surface tracking-tighter italic">98.2<span className="text-2xl">%</span></h2>
<div className="text-secondary font-semibold text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Optimized
            </div>
</div>
<div className="bg-surface-container-low p-8 rounded-xl space-y-2">
<p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500">Pending Orders</p>
<h2 className="text-5xl font-extrabold text-on-surface tracking-tighter italic">42</h2>
<div className="text-tertiary font-semibold text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm" data-icon="bolt">bolt</span>
              Automation active
            </div>
</div>
</div>

<div className="grid grid-cols-12 gap-8">
<div className="col-span-8 bg-surface-container-lowest rounded-xl p-10 overflow-hidden relative">
<div className="relative z-10">
<h3 className="text-2xl font-bold mb-4 tracking-tight">Main Production Facility</h3>
<p className="text-on-surface-variant max-w-md mb-8">Real-time throughput monitor for the Munich manufacturing hub. All systems operational with peak efficiency expected by 18:00.</p>
<div className="flex gap-4">
<button className="bg-primary text-on-primary px-8 py-3 rounded-xl font-semibold hover:brightness-110 transition-all">View Details</button>
<button className="bg-surface-container-highest px-8 py-3 rounded-xl font-semibold transition-all">Export Log</button>
</div>
</div>
<div className="absolute right-0 top-0 h-full w-1/3">
<img className="w-full h-full object-cover opacity-20" data-alt="Abstract view of modern industrial robotic arm in a clean manufacturing plant with blue ambient lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJx5miIHdpyfjkDENaFl7edx0X-rqqMMr4vJsKJW6s0YgV_3ewA99pTUCGZMc9kqUsPGXpqsIqgMChUl4zHAX0pkIItrboRwkolGMHhfB7tMGW6NYFX7J-Zdb-16XpIF5NOYz8GKcWTiQy1FPsZ3WH3o1X4CJCdtiHs7PtoSjWWjy5r-mDmHMAMqQXu1rsmBOsZVqdZO4ACFkN_hYRGSshEqT1yFD2iVt5xdnDkcMztnlh0RgDnWqO6CXFvjfBbzcIW11T2gZUGlWl"/>
</div>
</div>
<div className="col-span-4 bg-tertiary text-on-tertiary rounded-xl p-8 flex flex-col justify-between">
<div>
<span className="material-symbols-outlined text-4xl mb-4" data-icon="smart_toy">smart_toy</span>
<h4 className="text-xl font-bold tracking-tight">AI Insights</h4>
<p className="text-on-tertiary/80 mt-2 text-sm">Predictive maintenance suggests a check-up on Line B within 48 hours to prevent potential slowdowns.</p>
</div>
<a className="inline-flex items-center gap-2 font-bold text-sm mt-6 group" href="#">
              Explore Automation 
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</main>


<div className="fixed top-4 right-4 bottom-4 w-[420px] bg-white/70 glass-effect rounded-xl z-[60] flex flex-col shadow-[0px_20px_40px_rgba(0,87,194,0.12)]">

<div className="p-8 flex justify-between items-center">
<div>
<h2 className="text-2xl font-extrabold tracking-tight text-on-surface italic">Alerts Center</h2>
<div className="flex items-center gap-2 mt-1">
<span className="w-2 h-2 bg-primary rounded-full"></span>
<p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-primary">3 New Notifications</p>
</div>
</div>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-all">
<span className="material-symbols-outlined" data-icon="close">close</span>
</button>
</div>

<div className="px-8 pb-4 flex gap-6 text-sm font-semibold border-b border-outline-variant/10">
<button className="text-primary border-b-2 border-primary pb-2">All Activity</button>
<button className="text-slate-400 hover:text-slate-600 transition-colors pb-2">System</button>
<button className="text-slate-400 hover:text-slate-600 transition-colors pb-2">Orders</button>
</div>

<div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

<div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-error group hover:translate-x-[-4px] transition-transform">
<div className="flex gap-4">
<div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-error" data-icon="inventory_2" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
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

<div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-primary group hover:translate-x-[-4px] transition-transform">
<div className="flex gap-4">
<div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-primary" data-icon="local_shipping" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
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

<div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0px_10px_20px_rgba(0,0,0,0.02)] border-l-4 border-secondary group hover:translate-x-[-4px] transition-transform">
<div className="flex gap-4">
<div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-on-secondary-container" data-icon="precision_manufacturing" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
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

<div className="bg-surface-container-low/50 p-6 rounded-xl opacity-70 group hover:opacity-100 transition-opacity">
<div className="flex gap-4">
<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-slate-500" data-icon="update">update</span>
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

<div className="bg-surface-container-low/50 p-6 rounded-xl opacity-70 group hover:opacity-100 transition-opacity">
<div className="flex gap-4">
<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-slate-500" data-icon="account_balance_wallet">account_balance_wallet</span>
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
<span className="material-symbols-outlined text-xl" data-icon="done_all">done_all</span>
        Mark All as Read
      </button>
</div>
</div>

<div className="fixed inset-0 bg-slate-900/5 backdrop-blur-[2px] z-50 pointer-events-none"></div>

    </>
  );
}
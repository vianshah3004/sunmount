
export default function Settings() {
  return (
    <>
      
<header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center px-8 py-4 w-full">
<div className="flex items-center gap-8">
<span className="text-xl font-bold tracking-tight text-blue-700">Luminous OS</span>
<nav className="hidden md:flex gap-6">
<a className="text-slate-500 font-medium hover:bg-blue-50/50 transition-all px-3 py-1 rounded-full" href="#">Inventory</a>
<a className="text-slate-500 font-medium hover:bg-blue-50/50 transition-all px-3 py-1 rounded-full" href="#">Reports</a>
<a className="text-slate-500 font-medium hover:bg-blue-50/50 transition-all px-3 py-1 rounded-full" href="#">Automation</a>
</nav>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-slate-500 hover:bg-blue-50/50 rounded-full transition-all active:scale-95">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="p-2 text-blue-700 font-bold border-b-2 border-blue-700 active:scale-95 transition-all">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</button>
<div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
<img alt="User profile" className="w-full h-full object-cover" data-alt="professional portrait of a creative executive with soft natural lighting and a blurred minimalist studio background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNAYUnuiEsKKBAf-C46Th7hYqJl1yUaUnqBFadR7tKEDvtA_an9svyMwoGQlef-WbU3aSPFiV4CPfF2W4tbUBaZDIRoj-bDk6zfdQOjiLOkjA187GIB5_X3I4_H0o3_ErjYMZsJA5fTNAmM6pRWsBeEIv4mdKJ0aXJmP0fdzd2tDl4GclMVNwisZ0yZnPCTcS46WxbhqEay1IBm22XOUnQGTMJ36_Kkm3FL3PSo2wt57A7ljPUPuyKZ-kCKwgQIj_SQwR1ndW9Wt1V"/>
</div>
</div>
</header>
<div className="flex h-[calc(100-72px)]">
<aside className="bg-slate-50 h-screen w-64 fixed left-0 top-0 pt-20 hidden md:flex flex-col py-6">
<div className="px-6 mb-8">
<div className="flex items-center gap-3 mb-6">
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
<span className="material-symbols-outlined text-sm" data-icon="factory">factory</span>
</div>
<div>
<p className="text-lg font-black text-slate-900 leading-none">Global Ops</p>
<p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Enterprise Tier</p>
</div>
</div>
<button className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold active:scale-95 transition-all">
                    New Entry
                </button>
</div>
<nav className="flex-1 flex flex-col">
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="body-md font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="body-md font-medium">Orders</span>
</a>
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="body-md font-medium">Customers</span>
</a>
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="factory">factory</span>
<span className="body-md font-medium">Suppliers</span>
</a>
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="local_shipping">local_shipping</span>
<span className="body-md font-medium">Logistics</span>
</a>
</nav>
<div className="mt-auto border-t border-slate-200/50 pt-4">
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 transition-all" href="#">
<span className="material-symbols-outlined" data-icon="help">help</span>
<span className="body-md font-medium">Support</span>
</a>
<a className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-blue-600 transition-all" href="#">
<span className="material-symbols-outlined" data-icon="archive">archive</span>
<span className="body-md font-medium">Archive</span>
</a>
</div>
</aside>
<main className="flex-1 md:ml-64 p-8 lg:p-12 max-w-7xl mx-auto w-full">
<div className="mb-10">
<h1 className="text-[3.5rem] font-black tracking-tighter leading-tight text-on-surface mb-2">System Settings</h1>
<p className="text-on-surface-variant font-medium text-lg">Configure your global operating environment and automation preferences.</p>
</div>
<div className="flex flex-col lg:flex-row gap-8 items-start">
<div className="w-full lg:w-72 glass-panel rounded-xl p-4 shadow-[0px_20px_40px_rgba(0,87,194,0.06)] sticky top-28">
<div className="space-y-1">
<button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-blue-700 font-bold border-l-4 border-blue-600 bg-blue-50/50 text-left transition-all">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span className="text-sm">General</span>
</button>
<button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-slate-600 font-medium hover:bg-slate-100/50 text-left transition-all">
<span className="material-symbols-outlined" data-icon="payments">payments</span>
<span className="text-sm">Currency</span>
</button>
<button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-slate-600 font-medium hover:bg-slate-100/50 text-left transition-all">
<span className="material-symbols-outlined" data-icon="tune">tune</span>
<span className="text-sm">Preferences</span>
</button>
<button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-slate-600 font-medium hover:bg-slate-100/50 text-left transition-all">
<span className="material-symbols-outlined" data-icon="sync">sync</span>
<span className="text-sm">Sync</span>
</button>
</div>
</div>
<div className="flex-1 space-y-8 w-full">
<section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,87,194,0.04)]">
<div className="mb-8">
<h2 className="text-2xl font-bold tracking-tight text-on-surface">General Information</h2>
<p className="text-on-surface-variant text-sm mt-1">Basic identification and organizational structure.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Organization Name</label>
<input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium" type="text" value="Luminous Enterprises"/>
</div>
<div className="space-y-2">
<label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Primary Contact Email</label>
<input className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium" type="email" value="admin@luminous-os.tech"/>
</div>
<div className="space-y-2 md:col-span-2">
<label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Timezone</label>
<select className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium appearance-none">
<option>UTC-08:00 Pacific Time (US &amp; Canada)</option>
<option>UTC+00:00 Greenwich Mean Time (London)</option>
<option>UTC+01:00 Central European Time (Berlin)</option>
</select>
</div>
</div>
</section>
<section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,87,194,0.04)]">
<div className="mb-8">
<h2 className="text-2xl font-bold tracking-tight text-on-surface">Preferences &amp; Logic</h2>
<p className="text-on-surface-variant text-sm mt-1">Control how the system behaves and notifies users.</p>
</div>
<div className="space-y-6">
<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" data-icon="auto_awesome">auto_awesome</span>
</div>
<div>
<p className="font-bold text-on-surface">AI Insights Engine</p>
<p className="text-xs text-on-surface-variant">Enable autonomous forecasting and stock alerts.</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input checked="" className="sr-only peer" type="checkbox"/>
<div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
<div className="flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined" data-icon="bolt">bolt</span>
</div>
<div>
<p className="font-bold text-on-surface">High-Velocity Mode</p>
<p className="text-xs text-on-surface-variant">Prioritize interface speed over visual effects.</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input className="sr-only peer" type="checkbox"/>
<div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
</label>
</div>
</div>
</section>
<section className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_20px_40px_rgba(0,87,194,0.04)] relative overflow-hidden">
<div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
<div className="mb-8">
<h2 className="text-2xl font-bold tracking-tight text-on-surface">Synchronous Bridge</h2>
<p className="text-on-surface-variant text-sm mt-1">Manage external ERP and API connections.</p>
</div>
<div className="flex flex-col md:flex-row gap-4">
<div className="flex-1 p-6 border-2 border-primary/20 rounded-xl bg-primary/5 flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="cloud_sync">cloud_sync</span>
<div>
<p className="font-bold text-on-primary-fixed-variant">Mainframe ERP</p>
<p className="text-xs text-primary/70">Last synced: 2m ago</p>
</div>
</div>
<span className="bg-secondary text-on-secondary text-[10px] px-2 py-1 rounded font-bold">CONNECTED</span>
</div>
<button className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined" data-icon="add">add</span>
                                Add Integration
                            </button>
</div>
</section>
<div className="flex justify-end gap-4 pt-6">
<button className="px-8 py-4 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all">Discard Changes</button>
<button className="px-12 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Save Environment</button>
</div>
</div>
</div>
</main>
</div>
<nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t-0 py-3 px-6 flex justify-around items-center z-50">
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="text-[10px] font-medium">Home</span>
</button>
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="text-[10px] font-medium">Orders</span>
</button>
<button className="flex flex-col items-center gap-1 text-blue-700 font-bold">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span className="text-[10px]">Settings</span>
</button>
<button className="flex flex-col items-center gap-1 text-slate-500">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="text-[10px] font-medium">Users</span>
</button>
</nav>

    </>
  );
}
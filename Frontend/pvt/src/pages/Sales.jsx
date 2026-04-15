
export default function Sales() {
  return (
    <>
      

<aside className="fixed left-4 top-4 bottom-4 w-64 rounded-xl z-50 bg-slate-50/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(0,87,194,0.06)] flex flex-col p-6 gap-2">
<div className="mb-8 px-2">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
</div>
<div>
<h1 className="text-lg font-black text-blue-700 leading-none">Luminous</h1>
<p className="text-[0.6875rem] uppercase tracking-wider text-slate-500 font-semibold mt-1">Enterprise OS</p>
</div>
</div>
</div>
<nav className="flex-1 flex flex-col gap-1">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 hover:bg-white/50 rounded-lg" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="text-sm font-medium">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 hover:bg-white/50 rounded-lg" href="#">
<span className="material-symbols-outlined" data-icon="inventory_2">inventory_2</span>
<span className="text-sm font-medium">Inventory</span>
</a>

<a className="flex items-center gap-3 px-4 py-3 bg-white text-blue-700 shadow-sm border-l-4 border-blue-600 hover:translate-x-1 transition-all duration-300 rounded-lg" href="#">
<span className="material-symbols-outlined text-blue-700" data-icon="payments">payments</span>
<span className="text-sm font-semibold">Sales</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 hover:bg-white/50 rounded-lg" href="#">
<span className="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
<span className="text-sm font-medium">Purchase</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 hover:bg-white/50 rounded-lg" href="#">
<span className="material-symbols-outlined" data-icon="factory">factory</span>
<span className="text-sm font-medium">Manufacturing</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:translate-x-1 transition-all duration-300 hover:bg-white/50 rounded-lg" href="#">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
<span className="text-sm font-medium">Analytics</span>
</a>
</nav>
<div className="mt-auto p-4 bg-surface-container-low rounded-lg flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden">
<img alt="User profile" className="w-full h-full object-cover" data-alt="professional portrait of an operations manager in a bright office setting with soft natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT3JMofQCmvVWE-KRBpHAsdlngigykLWM8LNonfGzn2p6QSTieUCE5DXFZ1s-4Ur0ql3KnRCErnxr_42gd3gTHSiyv3CoJZFm0D33tG0ZGQBGVyit2B8bii4L14sYkxknAqWZXJi_RBbbBwz9L5PARwu08_AETUeIdamOcs-P8Q2uEEWYjOScGBwsoJQo-KRF73FMFiHm_Ka9_avXz8riv4NIkRexBnPd7Hb2hkUGixUKbqxmmaO1TC8ahiFwvr0tgA1fDG6OgXbVA"/>
</div>
<div className="overflow-hidden">
<p className="text-xs font-bold truncate">Aditya Sharma</p>
<p className="text-[10px] text-slate-500 uppercase">Head of Ops</p>
</div>
</div>
</aside>

<main className="ml-72 p-8 pt-24 min-h-screen">

<header className="fixed top-0 left-72 right-0 z-40 bg-white/70 backdrop-blur-xl px-8 py-4 flex justify-between items-center shadow-[0px_20px_40px_rgba(0,87,194,0.06)]">
<div className="flex items-center gap-6">
<h2 className="text-xl font-bold tracking-tighter text-slate-900">Sales Order Fulfillment</h2>
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20" placeholder="Search orders..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-slate-500 hover:bg-blue-50/50 rounded-full transition-colors active:scale-90">
<span className="material-symbols-outlined" data-icon="smart_toy">smart_toy</span>
</button>
<button className="p-2 text-slate-500 hover:bg-blue-50/50 rounded-full transition-colors active:scale-90">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
<button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform">
<span className="material-symbols-outlined text-sm">add</span>
                    New Order
                </button>
</div>
</header>

<section className="mb-12">
<div className="flex items-center justify-between max-w-5xl mx-auto bg-surface-container-lowest p-6 rounded-xl shadow-sm">
<div className="flex flex-col items-center gap-2 group">
<div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold relative">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>request_quote</span>
<div className="absolute -right-24 top-1/2 w-20 h-[2px] bg-secondary-container"></div>
</div>
<span className="text-xs font-bold uppercase tracking-widest text-on-secondary-container">Quotation</span>
</div>
<div className="flex flex-col items-center gap-2 group">
<div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold relative ring-4 ring-primary-fixed">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
<div className="absolute -right-24 top-1/2 w-20 h-[2px] bg-surface-variant"></div>
</div>
<span className="text-xs font-bold uppercase tracking-widest text-primary">Packing</span>
</div>
<div className="flex flex-col items-center gap-2 group opacity-50">
<div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold relative">
<span className="material-symbols-outlined">local_shipping</span>
<div className="absolute -right-24 top-1/2 w-20 h-[2px] bg-surface-variant"></div>
</div>
<span className="text-xs font-bold uppercase tracking-widest">Dispatch</span>
</div>
<div className="flex flex-col items-center gap-2 group opacity-50">
<div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold">
<span className="material-symbols-outlined">history</span>
</div>
<span className="text-xs font-bold uppercase tracking-widest">History</span>
</div>
</div>
</section>

<section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative">

<div className="surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-secondary transition-all hover:translate-y-[-4px]">
<div className="flex justify-between items-start mb-4">
<span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-black uppercase tracking-tighter rounded-full">Approved</span>
<p className="text-xs text-slate-400 font-medium">#SO-9821</p>
</div>
<h3 className="text-lg font-bold text-slate-800 mb-1">Reliance Retail Ltd.</h3>
<p className="text-sm text-slate-500 mb-4">Quotation: ₹ 4,50,000</p>
<div className="flex items-center gap-2 pt-4 border-t border-surface-container">
<div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-xs text-tertiary">bolt</span>
</div>
<span className="text-xs font-semibold text-tertiary">Auto-verified by AI</span>
</div>
</div>

<div className="hidden lg:flex items-center justify-center">
<div className="w-full h-px bg-gradient-to-r from-secondary-fixed to-primary-container relative">
<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-primary-container flex items-center justify-center">
<span className="material-symbols-outlined text-[10px] text-white">chevron_right</span>
</div>
</div>
</div>

<div className="bg-gradient-to-br from-primary-container to-primary text-white rounded-xl p-6 shadow-xl relative overflow-hidden group">
<div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
<span className="material-symbols-outlined text-6xl">inventory</span>
</div>
<div className="relative z-10">
<div className="flex justify-between items-start mb-4">
<span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-tighter rounded-full">Packing In-Progress</span>
<p className="text-xs text-white/70 font-medium">#SO-9821</p>
</div>
<h3 className="text-xl font-bold mb-1">Stock Allocation</h3>
<p className="text-sm text-white/80 mb-6">48/52 Units Ready</p>
<div className="w-full bg-white/20 h-2 rounded-full mb-6 overflow-hidden">
<div className="bg-secondary-fixed w-[92%] h-full rounded-full"></div>
</div>
<button className="w-full py-3 bg-white text-primary font-bold rounded-xl active:scale-95 transition-transform text-sm">
                        Confirm Packing Slip
                    </button>
</div>
</div>
</section>

<section className="grid grid-cols-12 gap-8">

<div className="col-span-12 xl:col-span-8 space-y-8">
<div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
<div className="flex items-center justify-between mb-8">
<h2 className="text-2xl font-bold tracking-tight">Order Line Items</h2>
<div className="flex gap-2">
<span className="px-4 py-2 bg-surface-container-low text-xs font-bold rounded-full">Draft Mode</span>
<span className="px-4 py-2 bg-primary-fixed text-primary text-xs font-bold rounded-full">Currency: ₹ INR</span>
</div>
</div>
<div className="space-y-4">

<div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
<div className="col-span-5">Product Details</div>
<div className="col-span-2 text-center">Quantity</div>
<div className="col-span-2 text-right">Unit Price</div>
<div className="col-span-2 text-right">Total</div>
<div className="col-span-1"></div>
</div>

<div className="grid grid-cols-12 gap-4 items-center bg-surface-container-low p-4 rounded-lg group hover:bg-white hover:shadow-md transition-all">
<div className="col-span-5 flex items-center gap-4">
<div className="w-12 h-12 bg-white rounded-lg border border-outline-variant flex items-center justify-center">
<img alt="Product" className="w-10 h-10 object-contain rounded" data-alt="minimalist white smartwatch product photography with clean studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANCwxHmSEaE0q6J9-1KXtrujq2vf2YDreoYq2gTjMtwT2c7Bem10gnIhsy_lHlp5UyJ9i1EYEWndLDN4mOZmgMnDoMyXedp_JOrAaVXn5z1vxWF0w0zgLLhUaHg540yYvB-_eFLrp4MKtWgn6TrQDeXqQuBNs0T_Ub23ZUKMti6db1L7xRffL1UBlgDnBHPlXiasocd5JVdanHz9ovUsXf0wxfZLraLpX19Va1ioa33fjbK-UUepAVsJucxQnozXtCXM2Tf7fCNi3a"/>
</div>
<div className="overflow-hidden">
<p className="font-bold text-sm truncate">Luminous Quantum Watch v4</p>
<p className="text-[10px] text-slate-500">SKU: WCH-QT-04-B</p>
</div>
</div>
<div className="col-span-2">
<input className="w-full text-center bg-transparent border-none focus:ring-0 font-semibold text-sm" type="number" value="12"/>
</div>
<div className="col-span-2 text-right font-medium text-sm text-slate-600">₹ 14,999</div>
<div className="col-span-2 text-right font-bold text-sm">₹ 1,79,988</div>
<div className="col-span-1 flex justify-end">
<button className="text-slate-300 hover:text-error transition-colors">
<span className="material-symbols-outlined text-lg">delete</span>
</button>
</div>
</div>

<div className="grid grid-cols-12 gap-4 items-center bg-surface-container-low p-4 rounded-lg group hover:bg-white hover:shadow-md transition-all">
<div className="col-span-5 flex items-center gap-4">
<div className="w-12 h-12 bg-white rounded-lg border border-outline-variant flex items-center justify-center">
<img alt="Product" className="w-10 h-10 object-contain rounded" data-alt="professional studio shot of premium noise cancelling headphones in charcoal grey" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYLEb2lGUg3_-g95bxST1wh_XT598r9hWVMhkTJly_OT8V_CFbfPajyib6r5ptNC6alYg-IK-fh3T1MAqS32d-sLgzNPNQc-5cV5RG8vB2eJ3ulGz57cGJSXgdcSHh_g7uBQd2ZY-f3aDSkqWyKXzpJyTLyZ9TY21RlE40FI-BPE2Ru23GYvCk9zCgN2SV3zQqUbcpz3BNdxOM3HXadQ022Civ9LjJV3uWrwZ3PlJ9BBKoYf5H-behoYrH4Y-ovh1on5nY7nMn3gKV"/>
</div>
<div className="overflow-hidden">
<p className="font-bold text-sm truncate">Sonic Boom Headphones Pro</p>
<p className="text-[10px] text-slate-500">SKU: AUD-SB-HP-01</p>
</div>
</div>
<div className="col-span-2">
<input className="w-full text-center bg-transparent border-none focus:ring-0 font-semibold text-sm" type="number" value="40"/>
</div>
<div className="col-span-2 text-right font-medium text-sm text-slate-600">₹ 6,750</div>
<div className="col-span-2 text-right font-bold text-sm">₹ 2,70,012</div>
<div className="col-span-1 flex justify-end">
<button className="text-slate-300 hover:text-error transition-colors">
<span className="material-symbols-outlined text-lg">delete</span>
</button>
</div>
</div>
<button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-slate-400 font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
<span className="material-symbols-outlined">add</span>
                            + Add Product
                        </button>
</div>
</div>
</div>

<div className="col-span-12 xl:col-span-4 space-y-6">

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
<h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Customer Information</h3>
<div className="space-y-4">
<div className="relative">
<label className="text-[10px] font-bold text-primary uppercase absolute top-2 left-4">Customer Name</label>
<input className="w-full pt-6 pb-2 px-4 bg-surface-container-low border-none rounded-lg font-bold text-sm" type="text" value="Reliance Retail Ltd."/>
<span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary text-sm">verified</span>
</div>
<div className="relative">
<label className="text-[10px] font-bold text-slate-400 uppercase absolute top-2 left-4">Shipping Address</label>
<textarea className="w-full pt-6 pb-2 px-4 bg-surface-container-low border-none rounded-lg text-sm h-24 resize-none">Tower C, 5th Floor, IBC Knowledge Park, Bannerghatta Road, Bengaluru, 560029</textarea>
</div>
</div>
</div>

<div className="glass-panel rounded-xl p-6 shadow-xl border border-white/40">
<h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Summary</h3>
<div className="space-y-3 mb-6">
<div className="flex justify-between text-sm">
<span className="text-slate-500">Subtotal</span>
<span className="font-semibold">₹ 4,50,000</span>
</div>
<div className="flex justify-between text-sm">
<span className="text-slate-500">Tax (GST 18%)</span>
<span className="font-semibold">₹ 81,000</span>
</div>
<div className="flex justify-between text-sm">
<span className="text-slate-500">Shipping</span>
<span className="text-secondary font-bold">FREE</span>
</div>
</div>
<div className="pt-4 border-t border-slate-200 mb-6">
<div className="flex justify-between items-end">
<span className="text-xs font-bold uppercase text-slate-400">Total Payable</span>
<span className="text-2xl font-black text-primary">₹ 5,31,000</span>
</div>
</div>
<button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-3">
<span className="material-symbols-outlined">rocket_launch</span>
                        Finalize &amp; Dispatch
                    </button>
</div>

<div className="bg-gradient-to-br from-tertiary/10 to-primary/5 rounded-xl p-6 border border-tertiary-fixed-dim">
<div className="flex items-center gap-3 mb-4">
<span className="material-symbols-outlined text-tertiary">psychology</span>
<h4 className="text-xs font-black uppercase tracking-widest text-tertiary">Luminous Intelligence</h4>
</div>
<p className="text-xs leading-relaxed text-slate-600">
                        This customer typically orders <span className="font-bold text-tertiary">20% more</span> during Q3. Suggest adding <span className="underline decoration-tertiary underline-offset-2">Luminous Power Bank Gen 2</span> to increase order value.
                    </p>
</div>
</div>
</section>
</main>


<nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant/10 px-6 py-3 flex justify-around items-center z-50">
<button className="flex flex-col items-center gap-1 text-slate-400">
<span className="material-symbols-outlined">dashboard</span>
<span className="text-[10px] font-bold">Home</span>
</button>
<button className="flex flex-col items-center gap-1 text-primary">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
<span className="text-[10px] font-bold">Sales</span>
</button>
<button className="flex flex-col items-center gap-1 text-slate-400">
<span className="material-symbols-outlined">inventory_2</span>
<span className="text-[10px] font-bold">Stock</span>
</button>
<button className="flex flex-col items-center gap-1 text-slate-400">
<span className="material-symbols-outlined">account_circle</span>
<span className="text-[10px] font-bold">Profile</span>
</button>
</nav>

    </>
  );
}
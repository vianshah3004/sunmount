import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/inventory', icon: 'inventory_2', label: 'Products' },
  { to: '/sales', icon: 'payments', label: 'Sales' },
  { to: '/purchase', icon: 'shopping_cart', label: 'Purchases' },
  { to: '/manufacturing', icon: 'factory', label: 'Manufacturing' },
  { to: '/history', icon: 'history', label: 'History' },
  { to: '/customers', icon: 'group', label: 'Customers' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SU';

export default function Sidebar({ open = false, onClose, authUser }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside className={`responsive-sidebar fixed left-0 top-0 z-50 flex h-screen w-64 flex-col gap-2 border-r border-white/70 bg-white/90 p-4 shadow-[0px_24px_60px_rgba(0,87,194,0.08)] backdrop-blur-2xl transition-transform duration-200 md:w-20 md:translate-x-0 lg:w-64 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="mb-4 flex items-start justify-between gap-3 px-3 pt-1 md:hidden">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="mb-6 px-2 pt-1 md:px-0 lg:px-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
        </div>
        <h1 className="hidden truncate text-xl font-black tracking-tight text-on-surface lg:block">Luminous OS</h1>
        <p className="mt-1 hidden text-[0.7rem] font-bold uppercase tracking-[0.24em] text-outline lg:block">Inventory Management</p>
        <p className="mt-3 hidden text-xs leading-relaxed text-slate-500 lg:block">Internal shared-login workspace for sales, purchases, manufacturing, and history.</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-0 lg:pr-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 md:px-2 lg:justify-start lg:px-4 ${
                isActive
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/15'
                  : 'text-slate-600 hover:bg-surface-container-low hover:text-on-surface hover:translate-x-1'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            <span className="hidden overflow-hidden text-[0.95rem] font-semibold whitespace-nowrap lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 lg:block">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-black text-sm">
            {getInitials(authUser?.username)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{authUser?.username ?? 'Shared User'}</p>
            <p className="text-[11px] text-outline truncate">{authUser?.role ?? 'Internal Access'}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-secondary font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          Cloud sync live
        </div>
      </div>
      </aside>
    </>
  );
}

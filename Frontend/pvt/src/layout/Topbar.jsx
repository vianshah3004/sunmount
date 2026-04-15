export default function Topbar({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  onMenuClick,
  onNotificationsClick,
  authUser,
  onLogout,
}) {
  return (
    <header className="mb-6 flex w-full flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/70 p-4 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] backdrop-blur-xl sm:p-5 lg:mb-8">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-3 lg:hidden">
          <button onClick={onMenuClick} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="min-w-0">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Internal Use Only</p>
            <h2 className="truncate text-2xl font-black tracking-tight text-on-surface leading-none">{title}</h2>
          </div>
        </div>
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Internal Use Only</p>
        <h2 className="hidden text-2xl font-black tracking-tight text-on-surface leading-none lg:block lg:text-[2.8rem]">{title}</h2>
        <p className="max-w-2xl text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>
      <div className="flex w-full flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-3 rounded-2xl border border-outline-variant/20 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:w-auto sm:min-w-[16rem] lg:w-[22rem]">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input className="w-full border-none bg-transparent text-sm outline-none focus:ring-0" placeholder={searchPlaceholder} type="text" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="hidden rounded-xl bg-surface-container-low px-3 py-2 text-xs font-black text-slate-600 sm:block">
            {authUser?.username ?? 'Internal User'}
          </div>
          <button onClick={onNotificationsClick} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-white/80 transition-colors hover:bg-primary/5">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
          </button>
          <button onClick={onLogout} className="flex h-11 items-center justify-center rounded-2xl border border-outline-variant/20 bg-white/80 px-3 text-xs font-black text-slate-600 transition-colors hover:bg-primary/5">
            Logout
          </button>
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white bg-primary-fixed shadow-sm">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

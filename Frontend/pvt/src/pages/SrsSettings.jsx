import { useEffect, useState } from 'react';
import { formatINR, formatShortDateTime } from '../lib/formatters';
import { getSettings, updateSettings, getSystemHealth } from '../lib/api';

const buildSettingsState = (payload = {}) => {
  const sync = payload.sync ?? {};
  return {
    organization: payload.organization || 'Luminous Enterprises',
    timezone: payload.timezone || 'Asia/Kolkata',
    currency: payload.currency || 'INR',
    primaryContactEmail: payload.primaryContactEmail || 'admin@luminous-os.tech',
    companyInfo: {
      name: sync.companyInfo?.name || payload.organization || 'Luminous Enterprises',
      gstin: sync.companyInfo?.gstin || '',
      address: sync.companyInfo?.address || '',
      phone: sync.companyInfo?.phone || '',
    },
    tax: {
      gstRate: Number(sync.tax?.gstRate ?? 18),
      inclusivePricing: Boolean(sync.tax?.inclusivePricing),
    },
    units: {
      weightUnit: sync.units?.weightUnit || 'kg',
      quantityUnit: sync.units?.quantityUnit || 'pcs',
    },
    preferences: {
      defaultOrderPageSize: Number(sync.preferences?.defaultOrderPageSize ?? 50),
      enableRealtimeSync: sync.preferences?.enableRealtimeSync ?? true,
      backupFrequency: sync.preferences?.backupFrequency || 'daily',
    },
    securityFlags: {
      sharedLoginEnabled: Boolean(payload.securityFlags?.sharedLoginEnabled),
      httpsEnabled: payload.securityFlags?.httpsEnabled ?? true,
      encryptionAtRest: payload.securityFlags?.encryptionAtRest || 'AES-256',
      backupsEnabled: payload.securityFlags?.backupsEnabled ?? true,
    },
    sync: {
      status: sync.status || 'Live',
      apiLatencyMs: Number(sync.apiLatencyMs ?? 118),
      backupWindow: sync.backupWindow || '02:00-03:00 IST',
      lastSyncAt: sync.lastSyncAt || new Date().toISOString(),
    },
  };
};

export default function SrsSettings() {
  const [settings, setSettings] = useState(buildSettingsState());
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formValues, setFormValues] = useState(buildSettingsState());

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const settingsData = await getSettings();
        const healthData = await getSystemHealth();
        
        if (!active) return;
        
        const nextState = buildSettingsState(settingsData);
        setSettings(nextState);
        setFormValues(nextState);
        setHealth(healthData);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load settings');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formValues.primaryContactEmail || ''));
    if (!isEmailValid) {
      setError('Primary contact email is invalid');
      return;
    }

    if (Number(formValues.tax.gstRate) < 0 || Number(formValues.tax.gstRate) > 100) {
      setError('GST rate must be between 0 and 100');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const updated = await updateSettings({
        organization: formValues.organization,
        timezone: formValues.timezone,
        currency: formValues.currency,
        primaryContactEmail: formValues.primaryContactEmail,
        companyInfo: formValues.companyInfo,
        tax: formValues.tax,
        units: formValues.units,
        preferences: formValues.preferences,
        securityFlags: formValues.securityFlags,
        sync: formValues.sync,
      });
      const nextState = buildSettingsState(updated);
      setSettings(nextState);
      setFormValues(nextState);
      setFeedback('Settings saved successfully');
    } catch (requestError) {
      setError(requestError.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFormValues(settings);
    setFeedback('Changes discarded');
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {error && <div className="rounded-[1.5rem] sm:rounded-2xl bg-error/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-error">{error}</div>}
      {feedback && <div className="rounded-[1.5rem] sm:rounded-2xl bg-secondary/10 p-3 sm:p-4 text-xs sm:text-sm font-bold text-secondary">{feedback}</div>}

      <section className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Deployment assumptions</p>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-on-surface mt-2">Shared login, cloud sync, encryption, and backups</h3>
        <p className="text-slate-500 mt-2 max-w-3xl">This screen captures the internal-only security posture described in the SRS: single shared login, HTTPS, AES-256 at rest, and automated cloud backups.</p>
      </section>

      <section className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] space-y-4 sm:space-y-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">General</p>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-on-surface mt-2">System identity</h3>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Organization</span>
              <input
                value={formValues.organization}
                onChange={(e) => setFormValues({ ...formValues, organization: e.target.value })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Timezone</span>
              <select
                value={formValues.timezone}
                onChange={(e) => setFormValues({ ...formValues, timezone: e.target.value })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              >
                <option>Asia/Kolkata</option>
                <option>UTC</option>
                <option>America/New_York (EST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Currency</span>
              <select
                value={formValues.currency}
                onChange={(e) => setFormValues({ ...formValues, currency: e.target.value })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Primary contact email</span>
              <input
                value={formValues.primaryContactEmail}
                onChange={(e) => setFormValues({ ...formValues, primaryContactEmail: e.target.value })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">GSTIN</span>
              <input
                value={formValues.companyInfo.gstin}
                onChange={(e) => setFormValues({ ...formValues, companyInfo: { ...formValues.companyInfo, gstin: e.target.value } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">GST Rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={formValues.tax.gstRate}
                onChange={(e) => setFormValues({ ...formValues, tax: { ...formValues.tax, gstRate: Number(e.target.value) } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Weight unit</span>
              <input
                value={formValues.units.weightUnit}
                onChange={(e) => setFormValues({ ...formValues, units: { ...formValues.units, weightUnit: e.target.value } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Quantity unit</span>
              <input
                value={formValues.units.quantityUnit}
                onChange={(e) => setFormValues({ ...formValues, units: { ...formValues.units, quantityUnit: e.target.value } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Default order page size</span>
              <input
                type="number"
                min="1"
                max="500"
                value={formValues.preferences.defaultOrderPageSize}
                onChange={(e) => setFormValues({ ...formValues, preferences: { ...formValues.preferences, defaultOrderPageSize: Number(e.target.value) } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Backup frequency</span>
              <select
                value={formValues.preferences.backupFrequency}
                onChange={(e) => setFormValues({ ...formValues, preferences: { ...formValues.preferences, backupFrequency: e.target.value } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              >
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">Backup window</span>
              <input
                value={formValues.sync.backupWindow}
                onChange={(e) => setFormValues({ ...formValues, sync: { ...formValues.sync, backupWindow: e.target.value } })}
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold"
              />
            </label>
          </div>
        </article>

        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)] space-y-4 sm:space-y-5">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Security</p>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-on-surface mt-2">Shared access and encryption</h3>
          </div>
          <div className="space-y-4">
            <label className="rounded-2xl bg-surface-container-low p-3 sm:p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-on-surface">Single shared login</p>
                <p className="text-sm text-slate-500 mt-1">No role-based complexity for internal deployment.</p>
              </div>
              <input
                type="checkbox"
                checked={formValues.securityFlags.sharedLoginEnabled}
                onChange={(e) => setFormValues({ ...formValues, securityFlags: { ...formValues.securityFlags, sharedLoginEnabled: e.target.checked } })}
                className="h-5 w-5"
              />
            </label>

            <label className="rounded-2xl bg-surface-container-low p-3 sm:p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-on-surface">HTTPS transport</p>
                <p className="text-sm text-slate-500 mt-1">Data encrypted in transit.</p>
              </div>
              <input
                type="checkbox"
                checked={formValues.securityFlags.httpsEnabled}
                onChange={(e) => setFormValues({ ...formValues, securityFlags: { ...formValues.securityFlags, httpsEnabled: e.target.checked } })}
                className="h-5 w-5"
              />
            </label>

            <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
              <p className="font-black text-on-surface">Encryption at rest</p>
              <input
                value={formValues.securityFlags.encryptionAtRest}
                onChange={(e) => setFormValues({ ...formValues, securityFlags: { ...formValues.securityFlags, encryptionAtRest: e.target.value } })}
                className="mt-2 w-full rounded-xl border-none bg-white px-3 py-2 text-sm font-bold"
              />
            </div>

            <label className="rounded-2xl bg-surface-container-low p-3 sm:p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-on-surface">Backups enabled</p>
                <p className="text-sm text-slate-500 mt-1">Automated cloud backup schedule.</p>
              </div>
              <input
                type="checkbox"
                checked={formValues.securityFlags.backupsEnabled}
                onChange={(e) => setFormValues({ ...formValues, securityFlags: { ...formValues.securityFlags, backupsEnabled: e.target.checked } })}
                className="h-5 w-5"
              />
            </label>

            <label className="rounded-2xl bg-surface-container-low p-3 sm:p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-on-surface">Realtime sync</p>
                <p className="text-sm text-slate-500 mt-1">Keep UI aligned with backend updates.</p>
              </div>
              <input
                type="checkbox"
                checked={formValues.preferences.enableRealtimeSync}
                onChange={(e) => setFormValues({ ...formValues, preferences: { ...formValues.preferences, enableRealtimeSync: e.target.checked } })}
                className="h-5 w-5"
              />
            </label>
          </div>
        </article>
      </section>

      <section className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[2rem] bg-white/90 border border-outline-variant/20 p-4 sm:p-6 shadow-[0px_18px_40px_rgba(0,87,194,0.06)]">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-secondary font-black">Integration</p>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-on-surface mt-2">Cloud sync bridge</h3>
          <div className="mt-4 rounded-[1.5rem] bg-primary/5 border border-primary/20 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <p className="font-black text-on-surface">Connected backend</p>
              <p className="text-sm text-slate-500 mt-1">Real-time cloud sync for desktop and web clients.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-black uppercase">Live</span>
          </div>
          <div className="mt-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {[
              ['API latency', health?.sync?.apiLatencyMs ? `${health.sync.apiLatencyMs}ms` : `${formValues.sync.apiLatencyMs}ms`],
              ['Last sync', health?.sync?.lastSyncAt ? formatShortDateTime(health.sync.lastSyncAt) : formatShortDateTime(formValues.sync.lastSyncAt)],
              ['Backup window', health?.sync?.backupWindow || formValues.sync.backupWindow],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-outline font-black">{label}</p>
                <p className="text-lg font-black text-on-surface mt-2">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] bg-primary text-white p-4 sm:p-6 shadow-lg shadow-primary/15">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/75 font-black">User actions</p>
          <h3 className="text-lg sm:text-xl font-black mt-2">Save, discard, and sync</h3>
          <div className="mt-5 space-y-3 text-sm text-white/80">
            <p>• Currency is standardized to INR across the UI.</p>
            <p>• Dashboard, tables, and master/detail views share the same visual language.</p>
            <p>• Performance-oriented layouts minimize visual clutter and loading friction.</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1 rounded-2xl bg-white text-primary px-4 py-3 text-sm font-black disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="flex-1 rounded-2xl bg-white/15 px-4 py-3 text-sm font-black hover:bg-white/25 disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

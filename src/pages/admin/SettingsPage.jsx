import { useState, useEffect } from 'react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [env, setEnv] = useState('sandbox');
  // Sandbox Keys
  const [sandboxMerchantId, setSandboxMerchantId] = useState('');
  const [sandboxServerKey, setSandboxServerKey] = useState('');
  const [sandboxClientKey, setSandboxClientKey] = useState('');
  // Prod Keys
  const [prodMerchantId, setProdMerchantId] = useState('');
  const [prodServerKey, setProdServerKey] = useState('');
  const [prodClientKey, setProdClientKey] = useState('');

  const [showServerKey, setShowServerKey] = useState(false);
  const [midtransTab, setMidtransTab] = useState('sandbox');

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [adminPhone, setAdminPhone] = useState('');
  const [systemAlertPhone, setSystemAlertPhone] = useState('');

  const [dokuEnv, setDokuEnv] = useState('sandbox');
  const [dokuSandboxClientId, setDokuSandboxClientId] = useState('');
  const [dokuSandboxSecretKey, setDokuSandboxSecretKey] = useState('');
  const [dokuProdClientId, setDokuProdClientId] = useState('');
  const [dokuProdSecretKey, setDokuProdSecretKey] = useState('');
  const [dokuTab, setDokuTab] = useState('sandbox');
  const [showDokuSecret, setShowDokuSecret] = useState(false);

  const [hasPin, setHasPin] = useState(false);
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  const [botStatus, setBotStatus] = useState('disconnected');
  const [botQr, setBotQr] = useState(null);
  const [botPhone, setBotPhone] = useState(null);
  const [botName, setBotName] = useState(null);
  const [botLoading, setBotLoading] = useState(false);
  const [botTestPhone, setBotTestPhone] = useState('');
  const [botTestResult, setBotTestResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/settings');
        const s = data.settings || {};
        
        setEnv(s.midtrans_env || 'sandbox');
        setMidtransTab(s.midtrans_env || 'sandbox');
        setMaintenanceMode(s.maintenance_mode === 'true' || s.maintenance_mode === true);

        // Legacy fallback (User had filled these as production credentials previously)
        const legacyMerchantId = s.midtrans_merchant_id || '';
        const legacyServerKey = s.midtrans_server_key || '';
        const legacyClientKey = s.midtrans_client_key || '';

        setSandboxMerchantId(s.midtrans_sandbox_merchant_id || '');
        setSandboxServerKey(s.midtrans_sandbox_server_key || '');
        setSandboxClientKey(s.midtrans_sandbox_client_key || '');

        setProdMerchantId(s.midtrans_prod_merchant_id || legacyMerchantId);
        setProdServerKey(s.midtrans_prod_server_key || legacyServerKey);
        setProdClientKey(s.midtrans_prod_client_key || legacyClientKey);

        setDokuEnv(s.doku_env || 'sandbox');
        setDokuTab(s.doku_env || 'sandbox');
        setDokuSandboxClientId(s.doku_sandbox_client_id || '');
        setDokuSandboxSecretKey(s.doku_sandbox_secret_key || '');
        setDokuProdClientId(s.doku_prod_client_id || '');
        setDokuProdSecretKey(s.doku_prod_secret_key || '');

        setAdminPhone(s.fonnte_admin_phone || '');
        setSystemAlertPhone(s.system_alert_phone || '');
      } catch {}
      try {
        const pinData = await api.get('/auth/admin/pin-status');
        setHasPin(pinData.hasPin);
      } catch {}
      try {
        const bot = await api.get('/wabot/status');
        setBotStatus(bot.status);
        setBotQr(bot.qr);
        setBotPhone(bot.phone);
        setBotName(bot.name);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (botStatus !== 'qr' && botStatus !== 'connecting') return;
    const interval = setInterval(async () => {
      try {
        const bot = await api.get('/wabot/status');
        setBotStatus(bot.status);
        setBotQr(bot.qr);
        setBotPhone(bot.phone);
        setBotName(bot.name);
        if (bot.status === 'connected') {
          toast.success('WhatsApp Bot terhubung!');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [botStatus]);

  const handleSavePin = async () => {
    if (!pinNew || pinNew.length < 4) return toast.error('PIN minimal 4 digit');
    if (pinNew !== pinConfirm) return toast.error('Konfirmasi PIN tidak cocok');
    setPinSaving(true);
    try {
      await api.post('/auth/admin/set-pin', { pin: pinNew });
      toast.success(hasPin ? 'PIN berhasil diperbarui' : 'PIN berhasil diaktifkan');
      setHasPin(true);
      setPinNew('');
      setPinConfirm('');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm('Hapus PIN quick-login?')) return;
    try {
      await api.delete('/auth/admin/pin');
      setHasPin(false);
      setPinNew('');
      setPinConfirm('');
      toast.success('PIN berhasil dihapus');
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus PIN');
    }
  };

  const saveMidtrans = async () => {
    try {
      await api.put('/settings', {
        midtrans_env: env,
        midtrans_sandbox_merchant_id: sandboxMerchantId,
        midtrans_sandbox_server_key: sandboxServerKey,
        midtrans_sandbox_client_key: sandboxClientKey,
        midtrans_prod_merchant_id: prodMerchantId,
        midtrans_prod_server_key: prodServerKey,
        midtrans_prod_client_key: prodClientKey,
      });
      toast.success('Semua konfigurasi Midtrans berhasil disimpan!');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan');
    }
  };

  const saveDoku = async () => {
    try {
      await api.put('/settings', {
        doku_env: dokuEnv,
        doku_sandbox_client_id: dokuSandboxClientId,
        doku_sandbox_secret_key: dokuSandboxSecretKey,
        doku_prod_client_id: dokuProdClientId,
        doku_prod_secret_key: dokuProdSecretKey,
      });
      toast.success('Konfigurasi DOKU berhasil disimpan!');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan konfigurasi DOKU');
    }
  };

  const toggleMaintenanceMode = async () => {
    const newVal = !maintenanceMode;
    if (newVal && !confirm('PENGINGAT: Mode Maintenance akan memblokir 100% akses pengguna public secara instan. Yakin ingin mengaktifkan?')) return;
    try {
      await api.put('/settings', { maintenance_mode: newVal.toString() });
      setMaintenanceMode(newVal);
      toast.success(newVal ? 'Sistem DIBLOKIR: Maintenance Aktif' : 'Sistem DIBUKA: Berjalan Normal');
    } catch (err) {
      toast.error('Gagal mengubah mode');
    }
  };

  const saveAdminContact = async () => {
    try {
      await api.put('/settings', { 
        fonnte_admin_phone: adminPhone.trim(),
        system_alert_phone: systemAlertPhone.trim()
      });
      toast.success('Pengaturan kontak berhasil disimpan');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan kontak');
    }
  };



  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin!');
  };

  const webhookUrl = `${window.location.origin}/api/midtrans/notification`;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[28px] text-base-content">settings</span>
        <h1 className="text-2xl font-bold text-base-content tracking-tight">Setelan Sistem</h1>
      </div>

      {/* PIN QUICK RE-LOGIN */}
      <div className="bg-base-100 shadow rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasPin ? 'bg-success/15 text-success' : 'bg-base-200 text-base-content/50'}`}>
              <span className="material-symbols-outlined text-[24px]">dialpad</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-base-content tracking-tight">PIN Quick Login</h2>
              <p className="text-sm text-base-content/60 mt-0.5">
                {hasPin ? (
                  <span className="text-success font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> PIN aktif</span>
                ) : (
                  'Bypass kata sandi otomatis saat sesi habis'
                )}
              </p>
            </div>
          </div>
          {hasPin && (
            <button onClick={handleRemovePin} className="btn btn-ghost text-error hover:bg-error/10 px-4 py-2 flex items-center gap-1.5 rounded-xl text-sm">
              <span className="material-symbols-outlined text-[16px]">delete</span> Hapus PIN
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              {hasPin ? 'Ganti PIN' : 'Buat PIN'} (4-8 digit)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[18px]">lock</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinNew}
                onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="input input-bordered w-full pl-11 font-mono tracking-widest"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">Konfirmasi PIN</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-[18px]">lock</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="input input-bordered w-full pl-11 font-mono tracking-widest"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePin}
          disabled={pinSaving || !pinNew || pinNew.length < 4}
          className="btn btn-primary px-6 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {pinSaving ? <span className="loading loading-spinner"></span> : <span className="material-symbols-outlined text-[18px]">save</span>}
          {hasPin ? 'Perbarui PIN' : 'Aktifkan PIN'}
        </button>
      </div>

      {/* MIDTRANS CONFIGURATION */}
      <div className="bg-base-100 shadow rounded-2xl p-6 sm:p-8 border-l-4 border-l-primary relative overflow-hidden">
        {/* Dynamic Badge indicating ACTIVE mode */}
        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${env === 'production' ? 'bg-success' : 'bg-primary'}`}>
          Active: {env === 'production' ? 'Production' : 'Sandbox'}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-base-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-base-content flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance</span> Payment Gateway
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Simpan dan pilih antara API Sandbox / Live Production</p>
          </div>
          <button onClick={saveMidtrans} className="btn btn-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan Semua
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-base-200 p-1 rounded-xl shadow-inner inline-flex">
            <button
              onClick={() => setEnv('sandbox')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                env === 'sandbox' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">science</span> Gunakan Sandbox
            </button>
            <button
              onClick={() => setEnv('production')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                env === 'production' 
                  ? 'bg-success text-white shadow-md' 
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span> Gunakan Live Production
            </button>
          </div>

          <p className="text-sm text-base-content/60">
            <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">info</span>
            Modul transaksi pelanggan saat ini dialihkan menggunakan API: <strong className={env === 'production' ? 'text-success' : 'text-primary'}>{env.toUpperCase()}</strong>.
          </p>

          <div className="border border-base-200 rounded-xl mt-4">
            {/* View Tabs */}
            <div className="flex border-b border-base-200 bg-base-200/50 rounded-t-xl overflow-hidden">
              <button 
                onClick={() => setMidtransTab('sandbox')}
                className={`flex-1 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${midtransTab === 'sandbox' ? 'border-primary text-primary bg-base-100' : 'border-transparent text-base-content/60 hover:bg-base-200/50'}`}
              >
                Kredensial Sandbox
              </button>
              <button 
                onClick={() => setMidtransTab('production')}
                className={`flex-1 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${midtransTab === 'production' ? 'border-success text-success bg-base-100' : 'border-transparent text-base-content/60 hover:bg-base-200/50'}`}
              >
                Kredensial Live Production
              </button>
            </div>

            <div className="p-5 space-y-4 bg-base-200/30">
              {/* Conditional Form Render */}
              {midtransTab === 'sandbox' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Sandbox Merchant ID</label>
                    <input
                      type="text"
                      value={sandboxMerchantId}
                      onChange={(e) => setSandboxMerchantId(e.target.value)}
                      placeholder="Gxxxxxxxx"
                      className="input input-bordered w-full border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-base-content/70 mb-2">Sandbox Client Key</label>
                      <input
                        type="text"
                        value={sandboxClientKey}
                        onChange={(e) => setSandboxClientKey(e.target.value)}
                        placeholder="SB-Mid-client-xxxxx"
                        className="input input-bordered w-full border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-base-content/70 mb-2">Sandbox Server Key</label>
                      <div className="relative">
                        <input
                          type={showServerKey ? 'text' : 'password'}
                          value={sandboxServerKey}
                          onChange={(e) => setSandboxServerKey(e.target.value)}
                          placeholder="SB-Mid-server-xxxxx"
                          className="input input-bordered w-full pr-12 border-primary/30 focus:border-primary"
                        />
                        <button onClick={() => setShowServerKey(!showServerKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                          <span className="material-symbols-outlined text-[20px]">{showServerKey ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Production Merchant ID</label>
                    <input
                      type="text"
                      value={prodMerchantId}
                      onChange={(e) => setProdMerchantId(e.target.value)}
                      placeholder="Mxxxxxxxx"
                      className="input input-bordered w-full border-success/30 focus:border-success"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-base-content/70 mb-2">Production Client Key</label>
                      <input
                        type="text"
                        value={prodClientKey}
                        onChange={(e) => setProdClientKey(e.target.value)}
                        placeholder="Mid-client-xxxxx"
                        className="input input-bordered w-full border-success/30 focus:border-success"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-base-content/70 mb-2">Production Server Key</label>
                      <div className="relative">
                        <input
                          type={showServerKey ? 'text' : 'password'}
                          value={prodServerKey}
                          onChange={(e) => setProdServerKey(e.target.value)}
                          placeholder="Mid-server-xxxxx"
                          className="input input-bordered w-full pr-12 border-success/30 focus:border-success"
                        />
                        <button onClick={() => setShowServerKey(!showServerKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                          <span className="material-symbols-outlined text-[20px]">{showServerKey ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-base-content/70 mb-2">Notification Webhook URL (Dipakai di kedua mode)</label>
            <div className="flex gap-2">
              <input type="text" value={webhookUrl} readOnly className="input input-bordered bg-base-200/50 flex-1 text-base-content/60 font-mono" />
              <button onClick={() => copyToClipboard(webhookUrl)} className="btn btn-outline flex items-center gap-1.5 flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">content_copy</span> Salin
              </button>
            </div>
            <p className="text-[12px] text-base-content/50 font-medium mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span> Pastikan URL ini sudah tertanam di Dashboard Midtrans (Sandbox & Prod).
            </p>
          </div>
        </div>
      </div>

      {/* DOKU PAYMENT GATEWAY */}
      <div className="bg-base-100 shadow rounded-2xl p-6 sm:p-8 border-l-4 border-l-info relative overflow-hidden">
        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${dokuEnv === 'production' ? 'bg-success' : 'bg-info'}`}>
          Active: {dokuEnv === 'production' ? 'Production' : 'Sandbox'}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-base-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-base-content flex items-center gap-2">
              <span className="material-symbols-outlined text-info">account_balance_wallet</span> DOKU API Gateway
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Layanan gateway pembayaran kedua / alternatif</p>
          </div>
          <button onClick={saveDoku} className="btn btn-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan DOKU
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-base-200 p-1 rounded-xl shadow-inner inline-flex">
            <button
              onClick={() => setDokuEnv('sandbox')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                dokuEnv === 'sandbox' 
                  ? 'bg-info text-white shadow-md' 
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">science</span> Sandbox
            </button>
            <button
              onClick={() => setDokuEnv('production')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                dokuEnv === 'production' 
                  ? 'bg-success text-white shadow-md' 
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span> Production
            </button>
          </div>

          <div className="border border-base-200 rounded-xl mt-4">
            <div className="flex border-b border-base-200 bg-base-200/50 rounded-t-xl overflow-hidden">
              <button 
                onClick={() => setDokuTab('sandbox')}
                className={`flex-1 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${dokuTab === 'sandbox' ? 'border-info text-info bg-base-100' : 'border-transparent text-base-content/60 hover:bg-base-200/50'}`}
              >
                Kredensial Sandbox
              </button>
              <button 
                onClick={() => setDokuTab('production')}
                className={`flex-1 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${dokuTab === 'production' ? 'border-success text-success bg-base-100' : 'border-transparent text-base-content/60 hover:bg-base-200/50'}`}
              >
                Kredensial Live Production
              </button>
            </div>

            <div className="p-5 space-y-4 bg-base-200/30">
              {dokuTab === 'sandbox' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Sandbox Client ID</label>
                    <input
                      type="text"
                      value={dokuSandboxClientId}
                      onChange={(e) => setDokuSandboxClientId(e.target.value)}
                      placeholder="Client ID..."
                      className="input input-bordered w-full border-info/30 focus:border-info"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Sandbox Secret Key</label>
                    <div className="relative">
                      <input
                        type={showDokuSecret ? 'text' : 'password'}
                        value={dokuSandboxSecretKey}
                        onChange={(e) => setDokuSandboxSecretKey(e.target.value)}
                        placeholder="Secret Key..."
                        className="input input-bordered w-full pr-12 border-info/30 focus:border-info"
                      />
                      <button onClick={() => setShowDokuSecret(!showDokuSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{showDokuSecret ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Production Client ID</label>
                    <input
                      type="text"
                      value={dokuProdClientId}
                      onChange={(e) => setDokuProdClientId(e.target.value)}
                      placeholder="Client ID..."
                      className="input input-bordered w-full border-success/30 focus:border-success"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70 mb-2">Production Secret Key</label>
                    <div className="relative">
                      <input
                        type={showDokuSecret ? 'text' : 'password'}
                        value={dokuProdSecretKey}
                        onChange={(e) => setDokuProdSecretKey(e.target.value)}
                        placeholder="Secret Key..."
                        className="input input-bordered w-full pr-12 border-success/30 focus:border-success"
                      />
                      <button onClick={() => setShowDokuSecret(!showDokuSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{showDokuSecret ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}
      <div className="bg-base-100 shadow rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-base-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-base-content flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">support_agent</span> Kontak Pusat Bantuan
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Muncul di UI pendaftaran dan gelembung chat bantuan pengguna</p>
          </div>
          <button onClick={saveAdminContact} className="btn btn-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              1. Nomor Publik (Pusat Bantuan)
            </label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="input input-bordered w-full"
            />
            <p className="text-xs text-base-content/50 mt-2">
              Ditampilkan ke publik sebagai tautan chat bantuan. Boleh dikosongkan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              2. Nomor Privat (Alert Sistem & Notifikasi)
            </label>
            <input
              type="text"
              value={systemAlertPhone}
              onChange={(e) => setSystemAlertPhone(e.target.value)}
              placeholder="Contoh: 0822..."
              className="input input-bordered w-full"
            />
            <p className="text-xs text-base-content/50 mt-2">
              <span className="text-warning font-bold">Privat.</span> Sistem akan mengirim pesan crash (500), eror midtrans, dan tarik dana HANYA ke nomor ini. Tidak disebar ke publik.
            </p>
          </div>
        </div>
      </div>

      {/* GLOBAL MAINTENANCE MODE */}
      <div className={`bg-base-100 shadow rounded-2xl p-6 sm:p-8 border-2 transition-colors ${maintenanceMode ? 'border-warning/50 bg-warning/5' : 'border-base-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${maintenanceMode ? 'bg-warning/20 text-warning' : 'bg-base-200 text-base-content/50'}`}>
              <span className="material-symbols-outlined text-[28px]">{maintenanceMode ? 'engineering' : 'public'}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-base-content flex items-center gap-2">
                Mode Pemeliharaan (Maintenance)
                {maintenanceMode && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning text-warning-content uppercase tracking-wider animate-pulse">Menyala</span>}
              </h2>
              <p className="text-sm text-base-content/60 mt-1 max-w-xl">
                Jika diaktifkan, seluruh antarmuka situs publik akan dikunci dan menampilkan layar "Sistem Sedang Diperbarui". Hanya panel admin yang tetap bisa diakses. Gunakan fitur ini saat merombak kodingan.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <input type="checkbox" className="toggle toggle-warning toggle-lg" checked={maintenanceMode} onChange={toggleMaintenanceMode} />
          </div>
        </div>
      </div>

      {/* WHATSAPP BOT (BAILEYS) */}
      <div className="bg-base-100 shadow rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-base-200 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-base-content flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span> WhatsApp Native Daemon
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Server pengiriman notifikasi mandiri</p>
          </div>
          <div>
            {botStatus === 'connected' ? (
              <button
                onClick={async () => {
                  if (!confirm('Putuskan koneksi WhatsApp Daemon?')) return;
                  try {
                    await api.post('/wabot/disconnect');
                    setBotStatus('disconnected'); setBotQr(null); setBotPhone(null);
                    toast.success('Diputus');
                  } catch { toast.error('Kesalahan jaringan'); }
                }}
                className="btn btn-outline btn-error px-6 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">link_off</span> Putus Server
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!confirm('Bersihkan semua cache memori sesi WhatsApp Daemon? Anda harus melakukan scan QR ulang setelah ini.')) return;
                    try {
                      await api.post('/wabot/disconnect');
                      setBotStatus('disconnected'); setBotQr(null); setBotPhone(null);
                      toast.success('Memori Sesi WhatsApp berhasil dibersihkan');
                    } catch { toast.error('Gagal membersihkan memori'); }
                  }}
                  className="btn btn-outline btn-error px-4 flex items-center gap-2"
                  title="Gunakan ini jika WhatsApp nyangkut / logout di HP"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span> Bersihkan Sesi
                </button>
                <button
                  onClick={async () => {
                    setBotLoading(true);
                    try {
                      const result = await api.post('/wabot/connect');
                      setBotStatus(result.status); setBotQr(result.qr);
                    } catch { toast.error('Gagal menghubungkan daemon'); }
                    finally { setBotLoading(false); }
                  }}
                  disabled={botLoading || botStatus === 'connecting'}
                  className="btn btn-primary px-6 flex items-center gap-2"
                >
                  {botLoading ? <span className="loading loading-spinner text-[18px]"></span> : <span className="material-symbols-outlined text-[18px]">wifi</span>}
                  Jalankan Server
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-base-200/50 border border-base-200">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${botStatus === 'connected' ? 'bg-success shadow-[0_0_8px_rgba(0,0,0,0.2)] shadow-success' : botStatus === 'qr' ? 'bg-warning animate-pulse' : 'bg-base-content/40'}`}></div>
          <div className="text-sm font-medium text-base-content/70">
            Status Unit: <span className="font-semibold text-base-content ml-1">{botStatus === 'connected' ? `Tersambung (Stabil) - ${botName || botPhone}` : botStatus === 'qr' ? 'Menunggu QRC Otorisasi' : botStatus === 'connecting' ? 'Menyinkronkan Sesi...' : 'Terputus/Idle'}</span>
          </div>
        </div>

        {botStatus === 'qr' && botQr && (
          <div className="flex flex-col items-center py-6 bg-base-200/50 rounded-xl border border-base-200 mb-6">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <img src={botQr} alt="QR Code" className="w-56 h-56" />
            </div>
            <p className="text-sm text-base-content/60 font-medium mt-4">Hubungkan melalui Linked Devices di pengaturan WhatsApp Anda.</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
              <span className="material-symbols-outlined animate-spin text-[14px]">sync</span> Mengonfirmasi sinyal perangkat...
            </div>
          </div>
        )}

        {botStatus === 'connected' && (
          <div className="bg-base-200/50 rounded-xl p-5 border border-base-200">
            <label className="block text-sm font-medium text-base-content/70 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">bug_report</span> Diagnostik Transmisi
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={botTestPhone}
                onChange={(e) => setBotTestPhone(e.target.value)}
                placeholder="Nomor ponsel penerima"
                className="input input-bordered w-full sm:w-2/3"
              />
              <button
                onClick={async () => {
                  if (!botTestPhone.trim()) return toast.error('Nomor wajib diisi');
                  setBotLoading(true); setBotTestResult(null);
                  try {
                    const r = await api.post('/wabot/test', { phone: botTestPhone.trim() });
                    setBotTestResult(r);
                    if (r.success) toast.success('Transmisi terkirim');
                    else toast.error(r.message);
                  } catch (e) { setBotTestResult({ success: false, message: e.message }); }
                  finally { setBotLoading(false); }
                }}
                disabled={botLoading}
                className="btn btn-outline sm:w-1/3 flex justify-center items-center gap-2"
              >
                {botLoading ? <span className="loading loading-spinner text-[18px]"></span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                Inject Payload
              </button>
            </div>
            {botTestResult && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium border ${botTestResult.success ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                {botTestResult.message}
              </div>
            )}
          </div>
        )}
      </div>



    </div>
  );
}

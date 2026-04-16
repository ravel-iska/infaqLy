import { useState, useEffect } from 'react';
import { testFonnteConnection } from '@/services/fonnte';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [env, setEnv] = useState('sandbox');
  const [merchantId, setMerchantId] = useState('');
  const [serverKey, setServerKey] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [showServerKey, setShowServerKey] = useState(false);

  const [waToken, setWaToken] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [showWaToken, setShowWaToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

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
        setMerchantId(s.midtrans_merchant_id || '');
        setServerKey(s.midtrans_server_key || '');
        setClientKey(s.midtrans_client_key || '');
        setWaToken(s.fonnte_token || '');
        setAdminPhone(s.fonnte_admin_phone || '');
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
        midtrans_merchant_id: merchantId,
        midtrans_server_key: serverKey,
        midtrans_client_key: clientKey,
      });
      toast.success('Pengaturan Midtrans tersimpan');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan');
    }
  };

  const saveFonnteToken = async () => {
    try {
      await api.put('/settings', { fonnte_token: waToken.trim() });
      toast.success('Token WhatsApp tersimpan');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan token');
    }
  };

  const saveAdminContact = async () => {
    try {
      await api.put('/settings', { fonnte_admin_phone: adminPhone.trim() });
      toast.success('Nomor Kontak tersimpan');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan nomor kontak');
    }
  };

  const handleTestConnection = async () => {
    const phone = testPhone.trim() || adminPhone.trim();
    if (!phone) return toast.error('Masukkan nomor pengujian');
    if (!waToken.trim()) return toast.error('Token Fonnte belum diisi');
    
    await saveFonnteToken();
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await testFonnteConnection(phone);
      setTestResult(result);
      if (result.success) toast.success('Test berhasil dikirim');
      else toast.error(result.message);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast.error('Gagal terhubung ke Fonnte');
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('URL disalin');
  };

  const webhookUrl = `${window.location.origin}/api/midtrans/notification`;

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl pb-12">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-3xl text-admin-text">settings</span>
        <h1 className="text-3xl font-extrabold text-admin-text font-headline tracking-tight">Setelan Sistem</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* PIN QUICK RE-LOGIN */}
        <div className="bg-white rounded-2xl border border-admin-border/50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasPin ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                <span className="material-symbols-outlined text-[24px]">dialpad</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-admin-text tracking-tight">PIN Quick Login</h2>
                <p className="text-sm text-admin-text-muted mt-0.5">
                  {hasPin ? (
                    <span className="text-primary font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> PIN aktif</span>
                  ) : (
                    'Fitur bypass kata sandi otomatis'
                  )}
                </p>
              </div>
            </div>
            {hasPin && (
              <button onClick={handleRemovePin} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">delete</span> Hapus
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">
                {hasPin ? 'Ganti PIN' : 'Buat PIN'} (4-8 digit)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 text-admin-text rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono tracking-widest text-center"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Konfirmasi PIN</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 text-admin-text rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono tracking-widest text-center"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePin}
            disabled={pinSaving || !pinNew || pinNew.length < 4}
            className="w-full sm:w-auto px-6 py-2.5 bg-admin-text hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pinSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
            {hasPin ? 'Perbarui PIN' : 'Aktifkan PIN'}
          </button>
        </div>

        {/* MIDTRANS CONFIGURATION */}
        <div className="bg-white rounded-2xl border border-admin-border/50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span> Payment Gateway
              </h2>
              <p className="text-sm text-admin-text-muted mt-1">Konfigurasi API Midtrans</p>
            </div>
            <button onClick={saveMidtrans} className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">save</span> Simpan
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Mode Lingkungan</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEnv('sandbox')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold border transition-colors ${env === 'sandbox' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Developer Sandbox
                </button>
                <button
                  onClick={() => setEnv('production')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold border transition-colors ${env === 'production' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  Live Production
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Merchant ID</label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder={env === 'sandbox' ? 'Gxxxxxxxx' : 'Mxxxxxxxx'}
                className="w-full bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Client Key</label>
                <input
                  type="text"
                  value={clientKey}
                  onChange={(e) => setClientKey(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Server Key</label>
                <div className="relative">
                  <input
                    type={showServerKey ? 'text' : 'password'}
                    value={serverKey}
                    onChange={(e) => setServerKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                  />
                  <button onClick={() => setShowServerKey(!showServerKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showServerKey ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Notification Webhook URL</label>
              <div className="flex gap-2">
                <input type="text" value={webhookUrl} readOnly className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 font-mono text-sm" />
                <button onClick={() => copyToClipboard(webhookUrl)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span> Salin
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Konfigurasikan URL ini pada pengaturan Payment Notification di Dashboard Midtrans.</p>
            </div>
          </div>
        </div>

        {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}
        <div className="bg-white rounded-2xl border border-admin-border/50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">support_agent</span> Pusat Layanan
              </h2>
              <p className="text-sm text-admin-text-muted mt-1">Sistem rute panggilan dan pesan dari antarmuka pengguna</p>
            </div>
            <button onClick={saveAdminContact} className="px-6 py-2.5 bg-admin-text hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span> Simpan
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Hotline WhatsApp (Pusat Bantuan)</label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full sm:w-1/2 bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
            />
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">Sistem gelembung chat bantuan akan mengaktifkan tombol ke nomor ini. Format valid yang diizinkan hanya susunan tanpa spasi awalan 08x/62x.</p>
          </div>
        </div>

        {/* FONNTE WHATSAPP CONFIGURATION */}
        <div className="bg-white rounded-2xl border border-admin-border/50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">api</span> Fonnte API Gateway
              </h2>
              <p className="text-sm text-admin-text-muted mt-1">Integrasi layanan otomatisasi pesan via provider Fonnte</p>
            </div>
            <button onClick={saveFonnteToken} className="px-6 py-2.5 bg-admin-text hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">save</span> Simpan
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-admin-text-secondary mb-2">Access Token</label>
              <div className="relative">
                <input
                  type={showWaToken ? 'text' : 'password'}
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                />
                <button onClick={() => setShowWaToken(!showWaToken)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showWaToken ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <label className="block text-sm font-semibold text-admin-text-secondary mb-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">electric_bolt</span> Uji Konektivitas Gateway</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Nomor pengujian (default: nomor pusat bantuan)"
                  className="w-full sm:w-2/3 bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className="w-full sm:w-1/3 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {testLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                  Kirim Ping
                </button>
              </div>

              {testResult && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-medium border ${testResult.success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">{testResult.success ? 'check_circle' : 'error'}</span> 
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WHATSAPP BOT (BAILEYS) */}
        <div className="bg-white rounded-2xl border border-admin-border/50 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">hub</span> WhatsApp Native Daemon
              </h2>
              <p className="text-sm text-admin-text-muted mt-1">Sistem pengiriman persinyalan langsung tanpa dependensi eksternal</p>
            </div>
            <div>
              {botStatus === 'connected' ? (
                <button
                  onClick={async () => {
                    if (!confirm('Putuskan koneksi WhatsApp Engine?')) return;
                    try {
                      await api.post('/wabot/disconnect');
                      setBotStatus('disconnected'); setBotQr(null); setBotPhone(null);
                      toast.success('Disonect Berhasil');
                    } catch { toast.error('Kesalahan jaringan'); }
                  }}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">link_off</span> Putus
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setBotLoading(true);
                    try {
                      const result = await api.post('/wabot/connect');
                      setBotStatus(result.status); setBotQr(result.qr);
                    } catch { toast.error('Kesalahan Engine'); }
                    finally { setBotLoading(false); }
                  }}
                  disabled={botLoading || botStatus === 'connecting'}
                  className="px-5 py-2.5 bg-admin-text hover:bg-black text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  {botLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">cast</span>}
                  Inisiasi
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${botStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : botStatus === 'qr' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <div className="text-sm font-medium text-admin-text">
              Status Operasional: <span className="font-bold ml-1">{botStatus === 'connected' ? `Tersambung (Koneksi Stabil) - ${botName || botPhone}` : botStatus === 'qr' ? 'Menunggu Konfirmasi Handshake' : botStatus === 'connecting' ? 'Sinkronisasi Ulang...' : 'Terputus/Idle'}</span>
            </div>
          </div>

          {botStatus === 'qr' && botQr && (
            <div className="flex flex-col items-center py-6 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <img src={botQr} alt="QR Code" className="w-56 h-56 rounded-xl" />
              </div>
              <p className="text-sm text-slate-500 font-bold mt-5 mb-1 text-center">Akses melalui Linked Devices pada aplikasi WhatsApp Anda.</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined animate-spin text-[14px]">sync</span> Meminta otorisasi...
              </div>
            </div>
          )}

          {botStatus === 'connected' && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <label className="block text-sm font-semibold text-admin-text-secondary mb-3 flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">bug_report</span> Diagnostik Pengiriman</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={botTestPhone}
                  onChange={(e) => setBotTestPhone(e.target.value)}
                  placeholder="Nomor verifikasi"
                  className="w-full sm:w-2/3 bg-white border border-slate-200 text-admin-text rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                />
                <button
                  onClick={async () => {
                    if (!botTestPhone.trim()) return toast.error('Tentukan destinasi');
                    setBotLoading(true); setBotTestResult(null);
                    try {
                      const r = await api.post('/wabot/test', { phone: botTestPhone.trim() });
                      setBotTestResult(r);
                      if (r.success) toast.success('Trasmisi berhasil');
                      else toast.error(r.message);
                    } catch (e) { setBotTestResult({ success: false, message: e.message }); }
                    finally { setBotLoading(false); }
                  }}
                  disabled={botLoading}
                  className="w-full sm:w-1/3 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {botLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                  Kirim Payload
                </button>
              </div>
              {botTestResult && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-medium border ${botTestResult.success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {botTestResult.message}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

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
    toast.success('Berhasil disalin!');
  };

  const webhookUrl = `${window.location.origin}/api/midtrans/notification`;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl pb-12">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[28px] text-admin-text">settings</span>
        <h1 className="text-2xl font-bold text-admin-text tracking-tight">Setelan Sistem</h1>
      </div>

      {/* PIN QUICK RE-LOGIN */}
      <div className="admin-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasPin ? 'bg-success/15 text-success' : 'bg-admin-bg-hover text-admin-text-muted'}`}>
              <span className="material-symbols-outlined text-[24px]">dialpad</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-admin-text tracking-tight">PIN Quick Login</h2>
              <p className="text-sm text-admin-text-muted mt-0.5">
                {hasPin ? (
                  <span className="text-success font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> PIN aktif</span>
                ) : (
                  'Bypass kata sandi otomatis saat sesi habis'
                )}
              </p>
            </div>
          </div>
          {hasPin && (
            <button onClick={handleRemovePin} className="btn-admin-ghost text-danger hover:bg-danger/10 px-4 py-2 flex items-center gap-1.5 rounded-admin text-sm">
              <span className="material-symbols-outlined text-[16px]">delete</span> Hapus PIN
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">
              {hasPin ? 'Ganti PIN' : 'Buat PIN'} (4-8 digit)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[18px]">lock</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinNew}
                onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="input-admin pl-11 font-mono tracking-widest"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Konfirmasi PIN</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-[18px]">lock</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="input-admin pl-11 font-mono tracking-widest"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePin}
          disabled={pinSaving || !pinNew || pinNew.length < 4}
          className="btn-admin-primary px-6 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {pinSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
          {hasPin ? 'Perbarui PIN' : 'Aktifkan PIN'}
        </button>
      </div>

      {/* MIDTRANS CONFIGURATION */}
      <div className="admin-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-admin-border pb-5">
          <div>
            <h2 className="text-lg font-semibold text-admin-text flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-accent">account_balance</span> Payment Gateway
            </h2>
            <p className="text-sm text-admin-text-muted mt-1">Konfigurasi API Midtrans</p>
          </div>
          <button onClick={saveMidtrans} className="btn-admin-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Mode Lingkungan</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEnv('sandbox')}
                className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${env === 'sandbox' ? 'bg-admin-accent text-white' : 'bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text'}`}
              >
                Sandbox Mode
              </button>
              <button
                onClick={() => setEnv('production')}
                className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${env === 'production' ? 'bg-success text-white' : 'bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text'}`}
              >
                Live Production
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Merchant ID</label>
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder={env === 'sandbox' ? 'Gxxxxxxxx' : 'Mxxxxxxxx'}
              className="input-admin"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">Client Key</label>
              <input
                type="text"
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                className="input-admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">Server Key</label>
              <div className="relative">
                <input
                  type={showServerKey ? 'text' : 'password'}
                  value={serverKey}
                  onChange={(e) => setServerKey(e.target.value)}
                  className="input-admin pr-12"
                />
                <button onClick={() => setShowServerKey(!showServerKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showServerKey ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Notification Webhook URL</label>
            <div className="flex gap-2">
              <input type="text" value={webhookUrl} readOnly className="input-admin flex-1 !text-admin-text-muted" />
              <button onClick={() => copyToClipboard(webhookUrl)} className="btn-admin-ghost flex items-center gap-1.5 flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">content_copy</span> Salin
              </button>
            </div>
            <p className="text-[12px] text-admin-text-muted font-medium mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span> Konfigurasi pada Payment Notification URL di Midtrans.
            </p>
          </div>
        </div>
      </div>

      {/* PUSAT BANTUAN & INFO KONTAK ADMIN */}
      <div className="admin-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-admin-border pb-5">
          <div>
            <h2 className="text-lg font-semibold text-admin-text flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-accent">support_agent</span> Kontak Pusat Bantuan
            </h2>
            <p className="text-sm text-admin-text-muted mt-1">Muncul di UI pendaftaran dan gelembung chat bantuan pengguna</p>
          </div>
          <button onClick={saveAdminContact} className="btn-admin-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-2">Nomor Telepon/WhatsApp Admin</label>
          <input
            type="text"
            value={adminPhone}
            onChange={(e) => setAdminPhone(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="input-admin w-full sm:w-1/2"
          />
          <p className="text-xs text-admin-text-muted mt-2">Diformat dengan angka tanpa spasi. Jika dikosongkan gelembung WhatsApp bantuan tidak akan muncul.</p>
        </div>
      </div>

      {/* WHATSAPP BOT (BAILEYS) */}
      <div className="admin-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-admin-border pb-5">
          <div>
            <h2 className="text-lg font-semibold text-admin-text flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-accent">hub</span> WhatsApp Native Daemon
            </h2>
            <p className="text-sm text-admin-text-muted mt-1">Server pengiriman notifikasi mandiri</p>
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
                className="btn-admin-ghost text-danger hover:bg-danger/10 px-6 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">link_off</span> Putus Server
              </button>
            ) : (
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
                className="btn-admin-primary px-6 flex items-center gap-2"
              >
                {botLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">wifi</span>}
                Jalankan Server
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 p-4 rounded-admin bg-admin-bg-sidebar border border-admin-border">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${botStatus === 'connected' ? 'bg-success shadow-glow-emerald' : botStatus === 'qr' ? 'bg-warning animate-pulse' : 'bg-admin-text-muted'}`}></div>
          <div className="text-sm font-medium text-admin-text-secondary">
            Status Unit: <span className="font-semibold text-admin-text ml-1">{botStatus === 'connected' ? `Tersambung (Stabil) - ${botName || botPhone}` : botStatus === 'qr' ? 'Menunggu QRC Otorisasi' : botStatus === 'connecting' ? 'Menyinkronkan Sesi...' : 'Terputus/Idle'}</span>
          </div>
        </div>

        {botStatus === 'qr' && botQr && (
          <div className="flex flex-col items-center py-6 bg-admin-bg-sidebar rounded-admin border border-admin-border mb-6">
            <div className="bg-white p-3 rounded-xl">
              <img src={botQr} alt="QR Code" className="w-56 h-56" />
            </div>
            <p className="text-sm text-admin-text-muted font-medium mt-4">Hubungkan melalui Linked Devices di pengaturan WhatsApp Anda.</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-admin-accent">
              <span className="material-symbols-outlined animate-spin text-[14px]">sync</span> Mengonfirmasi sinyal perangkat...
            </div>
          </div>
        )}

        {botStatus === 'connected' && (
          <div className="bg-admin-bg-sidebar rounded-admin p-5 border border-admin-border">
            <label className="block text-sm font-medium text-admin-text-secondary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">bug_report</span> Diagnostik Transmisi
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={botTestPhone}
                onChange={(e) => setBotTestPhone(e.target.value)}
                placeholder="Nomor ponsel penerima"
                className="input-admin sm:w-2/3"
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
                className="btn-admin-ghost sm:w-1/3 bg-admin-bg hover:bg-admin-bg-hover flex justify-center items-center gap-2"
              >
                {botLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                Inject Payload
              </button>
            </div>
            {botTestResult && (
              <div className={`mt-4 p-3 rounded-admin text-sm font-medium border ${botTestResult.success ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                {botTestResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FONNTE WHATSAPP CONFIGURATION */}
      <div className="admin-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-admin-border pb-5">
          <div>
            <h2 className="text-lg font-semibold text-admin-text flex items-center gap-2">
              <span className="material-symbols-outlined text-admin-accent">api</span> Fonnte API Gateway
            </h2>
            <p className="text-sm text-admin-text-muted mt-1">Layanan perpesanan alternatif / fallback provider</p>
          </div>
          <button onClick={saveFonnteToken} className="btn-admin-primary flex items-center gap-2 px-6">
            <span className="material-symbols-outlined text-[18px]">save</span> Simpan
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Access Token</label>
            <div className="relative">
              <input
                type={showWaToken ? 'text' : 'password'}
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                className="input-admin pr-12"
              />
              <button onClick={() => setShowWaToken(!showWaToken)} className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors">
                <span className="material-symbols-outlined text-[20px]">{showWaToken ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="bg-admin-bg-sidebar rounded-admin p-5 border border-admin-border">
            <label className="block text-sm font-medium text-admin-text-secondary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">electric_bolt</span> Ping Infrastruktur Jaringan
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Nomor pengujian (kosong untuk default kontak)"
                className="input-admin sm:w-2/3"
              />
              <button
                onClick={handleTestConnection}
                disabled={testLoading}
                className="btn-admin-ghost sm:w-1/3 bg-admin-bg hover:bg-admin-bg-hover flex justify-center items-center gap-2"
              >
                {testLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">rss_feed</span>}
                Kirim Ping
              </button>
            </div>

            {testResult && (
              <div className={`mt-4 p-3 rounded-admin text-sm font-medium border ${testResult.success ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">{testResult.success ? 'check_circle' : 'error'}</span> 
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

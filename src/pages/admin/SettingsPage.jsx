import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Copy, Send, CheckCircle, XCircle, Loader2, ShieldCheck, Lock, Trash2, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { testFonnteConnection } from '@/services/fonnte';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  // ═══ Midtrans Settings ═══
  const [env, setEnv] = useState('sandbox');
  const [merchantId, setMerchantId] = useState('');
  const [serverKey, setServerKey] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [showServerKey, setShowServerKey] = useState(false);

  // ═══ Fonnte WhatsApp Settings ═══
  const [waToken, setWaToken] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [showWaToken, setShowWaToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // ═══ PIN Settings ═══
  const [hasPin, setHasPin] = useState(false);
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  // ═══ WA Bot Settings ═══
  const [botStatus, setBotStatus] = useState('disconnected');
  const [botQr, setBotQr] = useState(null);
  const [botPhone, setBotPhone] = useState(null);
  const [botName, setBotName] = useState(null);
  const [botLoading, setBotLoading] = useState(false);
  const [botTestPhone, setBotTestPhone] = useState('');
  const [botTestResult, setBotTestResult] = useState(null);

  // Load settings from database on mount
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
      // Check PIN status
      try {
        const pinData = await api.get('/auth/admin/pin-status');
        setHasPin(pinData.hasPin);
      } catch {}
      // Check WA Bot status
      try {
        const bot = await api.get('/wabot/status');
        setBotStatus(bot.status);
        setBotQr(bot.qr);
        setBotPhone(bot.phone);
        setBotName(bot.name);
      } catch {}
    })();
  }, []);

  // Poll bot status when connecting/qr
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
          toast.success('WhatsApp Bot terhubung! ✅');
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [botStatus]);

  // ═══ Save/Remove PIN ═══
  const handleSavePin = async () => {
    if (!pinNew || pinNew.length < 4) {
      toast.error('PIN minimal 4 digit');
      return;
    }
    if (pinNew !== pinConfirm) {
      toast.error('Konfirmasi PIN tidak cocok');
      return;
    }
    setPinSaving(true);
    try {
      await api.post('/auth/admin/set-pin', { pin: pinNew });
      toast.success(hasPin ? 'PIN berhasil diperbarui! 🔐' : 'PIN logout berhasil diaktifkan! 🔐');
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
    if (!confirm('Hapus PIN logout? Admin bisa keluar tanpa verifikasi.')) return;
    try {
      await api.delete('/auth/admin/pin');
      setHasPin(false);
      setPinNew('');
      setPinConfirm('');
      toast.success('PIN logout berhasil dihapus');
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus PIN');
    }
  };

  // ═══ Save Midtrans ═══
  const saveMidtrans = async () => {
    try {
      await api.put('/settings', {
        midtrans_env: env,
        midtrans_merchant_id: merchantId,
        midtrans_server_key: serverKey,
        midtrans_client_key: clientKey,
      });
      toast.success('Pengaturan Midtrans berhasil disimpan! ✅');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan');
    }
  };

  // ═══ Save Fonnte / WhatsApp Token ═══
  const saveFonnteToken = async () => {
    try {
      await api.put('/settings', {
        fonnte_token: waToken.trim(),
      });
      toast.success('Token WhatsApp berhasil disimpan! ✅');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan token');
    }
  };

  // ═══ Save Admin Contact / Pusat Bantuan ═══
  const saveAdminContact = async () => {
    try {
      await api.put('/settings', {
        fonnte_admin_phone: adminPhone.trim(),
      });
      toast.success('Nomor Pusat Bantuan berhasil disimpan! ✅');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan nomor kontak');
    }
  };
  // ═══ Save functions omitted for brevity in replacement preview ═══

  // ═══ Test Fonnte Connection ═══
  const handleTestConnection = async () => {
    const phone = testPhone.trim() || adminPhone.trim();
    if (!phone) {
      toast.error('Masukkan nomor WhatsApp tujuan untuk test');
      return;
    }
    if (!waToken.trim()) {
      toast.error('Token Fonnte belum diisi');
      return;
    }

    // Save first so backend can use the token
    await saveFonnteToken();

    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await testFonnteConnection(phone);
      setTestResult(result);
      if (result.success) {
        toast.success('Test berhasil! Cek WhatsApp Anda 📱');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast.error('Gagal terhubung ke Fonnte');
    } finally {
      setTestLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard!');
  };

  const webhookUrl = `${window.location.origin}/api/midtrans/notification`;

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-admin-text">⚙️ Pengaturan</h1>

      {/* ════════════════════════════════════════ */}
      {/* PIN QUICK RE-LOGIN                        */}
      {/* ════════════════════════════════════════ */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasPin ? 'bg-success/15' : 'bg-admin-bg-hover'}`}>
              <ShieldCheck size={22} className={hasPin ? 'text-success' : 'text-admin-text-muted'} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-admin-text">🔐 PIN Quick Login</h2>
              <p className="text-sm text-admin-text-muted mt-0.5">
                {hasPin ? (
                  <span className="text-success font-medium">✅ PIN aktif — masuk cepat saat session habis</span>
                ) : (
                  'Atur PIN agar bisa login cepat tanpa password saat session habis'
                )}
              </p>
            </div>
          </div>
          {hasPin && (
            <button onClick={handleRemovePin} className="btn-admin-ghost text-sm text-danger hover:bg-danger/10">
              <Trash2 size={14} /> Hapus PIN
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">
              {hasPin ? 'PIN Baru' : 'Buat PIN'} (4-8 digit)
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinNew}
                onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="input-admin pl-10 tracking-widest text-center font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Konfirmasi PIN</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="input-admin pl-10 tracking-widest text-center font-mono"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePin}
          disabled={pinSaving || !pinNew || pinNew.length < 4}
          className="btn-admin-primary text-sm mt-4"
        >
          {pinSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          {hasPin ? 'Perbarui PIN' : 'Aktifkan PIN'}
        </button>

        <p className="text-xs text-admin-text-muted mt-3">
          💡 Session admin berlaku <strong className="text-admin-text">30 hari</strong>.
          Jika PIN aktif, saat session habis Anda cukup masukkan PIN tanpa perlu ketik username & password lagi.
        </p>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* WHATSAPP BOT (BAILEYS)                  */}
      {/* ════════════════════════════════════════ */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${botStatus === 'connected' ? 'bg-success/15' : 'bg-admin-bg-hover'}`}>
              <Smartphone size={22} className={botStatus === 'connected' ? 'text-success' : 'text-admin-text-muted'} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-admin-text">📱 WhatsApp Bot (OTP)</h2>
              <p className="text-sm text-admin-text-muted mt-0.5">
                {botStatus === 'connected' ? (
                  <span className="text-success font-medium">✅ Terhubung — {botName || botPhone}</span>
                ) : botStatus === 'qr' ? (
                  <span className="text-warning font-medium">📷 Scan QR Code di bawah</span>
                ) : botStatus === 'connecting' ? (
                  <span className="text-admin-accent font-medium">⏳ Menghubungkan...</span>
                ) : (
                  'Bot belum terhubung — hubungkan untuk kirim OTP gratis'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {botStatus === 'connected' ? (
              <button
                onClick={async () => {
                  if (!confirm('Putuskan koneksi WhatsApp Bot?')) return;
                  try {
                    await api.post('/wabot/disconnect');
                    setBotStatus('disconnected'); setBotQr(null); setBotPhone(null);
                    toast.success('Bot terputus');
                  } catch { toast.error('Gagal disconnect'); }
                }}
                className="btn-admin-ghost text-sm text-danger hover:bg-danger/10"
              >
                <WifiOff size={14} /> Putuskan
              </button>
            ) : (
              <button
                onClick={async () => {
                  setBotLoading(true);
                  try {
                    const result = await api.post('/wabot/connect');
                    setBotStatus(result.status); setBotQr(result.qr);
                  } catch { toast.error('Gagal menghubungkan bot'); }
                  finally { setBotLoading(false); }
                }}
                disabled={botLoading || botStatus === 'connecting'}
                className="btn-admin-primary text-sm"
              >
                {botLoading ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
                {botLoading ? 'Connecting...' : 'Hubungkan Bot'}
              </button>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        {botStatus === 'qr' && botQr && (
          <div className="flex flex-col items-center py-4 mb-4">
            <img src={botQr} alt="QR Code" className="w-64 h-64 rounded-xl border-2 border-admin-border" />
            <p className="text-sm text-admin-text-secondary mt-3 font-medium">Scan QR ini dengan WhatsApp di HP Anda</p>
            <p className="text-xs text-admin-text-muted mt-1">WhatsApp → ⋮ → Linked Devices → Link a Device</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-admin-accent">
              <RefreshCw size={12} className="animate-spin" /> Menunggu scan...
            </div>
          </div>
        )}

        {/* Test Message (when connected) */}
        {botStatus === 'connected' && (
          <div className="pt-3 border-t border-admin-border">
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">🧪 Test Kirim Pesan via Bot</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={botTestPhone}
                onChange={(e) => setBotTestPhone(e.target.value)}
                placeholder="081234567890"
                className="input-admin flex-1"
              />
              <button
                onClick={async () => {
                  if (!botTestPhone.trim()) { toast.error('Masukkan nomor'); return; }
                  setBotLoading(true); setBotTestResult(null);
                  try {
                    const r = await api.post('/wabot/test', { phone: botTestPhone.trim() });
                    setBotTestResult(r);
                    if (r.success) toast.success('Test berhasil! 📱');
                    else toast.error(r.message);
                  } catch (e) { setBotTestResult({ success: false, message: e.message }); }
                  finally { setBotLoading(false); }
                }}
                disabled={botLoading}
                className="btn-admin-primary text-sm flex-shrink-0"
              >
                {botLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Kirim
              </button>
            </div>
            {botTestResult && (
              <div className={`mt-2 p-2 rounded-admin text-xs ${botTestResult.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {botTestResult.success ? '✅' : '❌'} {botTestResult.message}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-admin-text-muted mt-3">
          💡 Bot ini mengirim OTP gratis tanpa Fonnte. Gunakan nomor WA <strong className="text-admin-text">khusus bot</strong> (bukan nomor pribadi).
          Prioritas: Bot → Fonnte → gagal.
        </p>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* MIDTRANS CONFIGURATION                  */}
      {/* ════════════════════════════════════════ */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-admin-text">💳 Midtrans Payment Gateway</h2>
            <p className="text-sm text-admin-text-muted mt-1">Konfigurasi Server Key dan Client Key untuk pembayaran</p>
          </div>
          <button onClick={saveMidtrans} className="btn-admin-primary text-sm">
            <Save size={16} /> Simpan
          </button>
        </div>

        <div className="space-y-4">
          {/* Environment Toggle */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Environment</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEnv('sandbox')}
                className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${env === 'sandbox' ? 'bg-admin-accent text-white' : 'bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text'}`}
              >
                🧪 Sandbox
              </button>
              <button
                onClick={() => setEnv('production')}
                className={`px-4 py-2 rounded-admin text-sm font-medium transition-colors ${env === 'production' ? 'bg-success text-white' : 'bg-admin-bg-hover text-admin-text-secondary hover:text-admin-text'}`}
              >
                🚀 Production
              </button>
            </div>
          </div>

          {/* Merchant ID */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Merchant ID *</label>
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder={env === 'sandbox' ? 'G123456789' : 'M123456789'}
              className="input-admin"
            />
            <p className="text-xs text-admin-text-muted mt-1">Dashboard Midtrans → Settings → Access Keys → Merchant ID</p>
          </div>

          {/* Server Key */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Server Key *</label>
            <div className="relative">
              <input
                type={showServerKey ? 'text' : 'password'}
                value={serverKey}
                onChange={(e) => setServerKey(e.target.value)}
                placeholder={env === 'sandbox' ? 'SB-Mid-server-xxxxx' : 'Mid-server-xxxxx'}
                className="input-admin pr-12"
              />
              <button onClick={() => setShowServerKey(!showServerKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors">
                {showServerKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Client Key */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Client Key *</label>
            <input
              type="text"
              value={clientKey}
              onChange={(e) => setClientKey(e.target.value)}
              placeholder={env === 'sandbox' ? 'SB-Mid-client-xxxxx' : 'Mid-client-xxxxx'}
              className="input-admin"
            />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Notification URL (Webhook)</label>
            <div className="flex gap-2">
              <input type="text" value={webhookUrl} readOnly className="input-admin flex-1 !text-admin-text-muted" />
              <button onClick={() => copyToClipboard(webhookUrl)} className="btn-admin-ghost text-sm flex-shrink-0">
                <Copy size={16} /> Salin
              </button>
            </div>
            <p className="text-xs text-admin-text-muted mt-1">Tempel URL ini di dashboard Midtrans → Settings → Payment Notification URL</p>
          </div>

          {/* How to get keys */}
          <div className="p-4 rounded-admin bg-admin-bg-sidebar border border-admin-border">
            <h3 className="text-sm font-semibold text-admin-text mb-2">📖 Cara Mendapatkan Key Midtrans</h3>
            <ol className="text-xs text-admin-text-muted space-y-1 list-decimal list-inside">
              <li>Buka <a href="https://dashboard.sandbox.midtrans.com" target="_blank" rel="noopener noreferrer" className="text-admin-accent hover:underline">dashboard.sandbox.midtrans.com</a> (sandbox) atau <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener noreferrer" className="text-admin-accent hover:underline">dashboard.midtrans.com</a> (production)</li>
              <li>Login / Daftar akun merchant</li>
              <li>Buka menu <strong className="text-admin-text">Settings → Access Keys</strong></li>
              <li>Salin <strong className="text-admin-text">Merchant ID</strong>, <strong className="text-admin-text">Server Key</strong>, dan <strong className="text-admin-text">Client Key</strong></li>
              <li>Paste di field di atas, pilih environment yang sesuai</li>
              <li>Jangan lupa set <strong className="text-admin-text">Notification URL</strong> di dashboard Midtrans</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* FONNTE WHATSAPP CONFIGURATION            */}
      {/* ════════════════════════════════════════ */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-admin-text">📱 Fonnte WhatsApp API (Gateway OTP Cadangan)</h2>
            <p className="text-sm text-admin-text-muted mt-1">Konfigurasi Gateway Alternatif Jika Baileys Bot Mati</p>
          </div>
          <button onClick={saveFonnteToken} className="btn-admin-primary text-sm">
            <Save size={16} /> Simpan Token
          </button>
        </div>

        <div className="space-y-4">
          {/* Fonnte Token */}
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Token Fonnte *</label>
            <div className="relative">
              <input
                type={showWaToken ? 'text' : 'password'}
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="Paste token dari dashboard Fonnte..."
                className="input-admin pr-12"
              />
              <button onClick={() => setShowWaToken(!showWaToken)} className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors">
                {showWaToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-admin-text-muted mt-1">
              Dapatkan token di{' '}
              <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-admin-accent hover:underline">fonnte.com</a>
              {' → Device → Klik device → Salin Token'}
            </p>
          </div>

          {/* Admin Phone MOVED HIGHER OR SEPARATED */}
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* PUSAT BANTUAN & INFO KONTAK ADMIN      */}
      {/* ════════════════════════════════════════ */}
      <div className="admin-card p-6 border border-emerald-500/20 bg-emerald-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-emerald-800">📞 Pusat Bantuan & Kontak Dukungan</h2>
            <p className="text-sm text-emerald-600/80 mt-1">Nomor telepon ini yang akan ditampilkan di web & gelembung WhatsApp utama user</p>
          </div>
          <button onClick={saveAdminContact} className="btn-admin-primary text-sm bg-emerald-600 hover:bg-emerald-700">
            <Save size={16} /> Simpan Nomor
          </button>
        </div>

        <div className="space-y-4">
          {/* Admin Phone */}
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-1.5">Nomor Telepon/WhatsApp Admin</label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="input-admin border-emerald-200 focus:border-emerald-500 bg-white"
            />
            <p className="text-xs text-emerald-700/70 mt-2 font-medium">Jika ini kosong, tombol WA Pusat Bantuan tidak akan berfungsi/hilang. Format wajib menggunakan awalan 08xxx atau 62xxx tanpa spasi/simbol.</p>
          </div>
        </div>
      </div>
      
      {/* Fonnte Test Connection (Moved into a new Section to not clutter) */}
      <div className="admin-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-admin-text">🧪 Test Kirim Notifikasi via Fonnte</h2>
        </div>
        <div className="space-y-4">
          {/* Test Connection */}
          <div className="pt-3 border-t border-admin-border">
            <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">🧪 Test Kirim Pesan</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Nomor tujuan test (kosongkan = pakai nomor admin)"
                className="input-admin flex-1"
              />
              <button
                onClick={handleTestConnection}
                disabled={testLoading}
                className="btn-admin-primary text-sm flex-shrink-0"
              >
                {testLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {testLoading ? 'Mengirim...' : 'Kirim Test'}
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`mt-3 flex items-start gap-2 p-3 rounded-admin text-sm ${testResult.success ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                {testResult.success ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium">{testResult.success ? 'Berhasil!' : 'Gagal'}</p>
                  <p className="text-xs mt-0.5 opacity-80">{testResult.message}</p>
                  {testResult.data && (
                    <pre className="text-xs mt-2 font-mono bg-black/10 p-2 rounded overflow-x-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-admin bg-admin-bg-sidebar border border-admin-border">
            <h3 className="text-sm font-semibold text-admin-text mb-2">📖 Cara Mendapatkan Token Fonnte</h3>
            <ol className="text-xs text-admin-text-muted space-y-1.5 list-decimal list-inside">
              <li>Buka <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-admin-accent hover:underline">fonnte.com</a> → Daftar akun gratis</li>
              <li>Setelah login, klik <strong className="text-admin-text">"Add Device"</strong></li>
              <li>Masukkan nomor WhatsApp yang akan dipakai kirim notifikasi</li>
              <li>Fonnte akan tampilkan <strong className="text-admin-text">QR Code</strong></li>
              <li>Buka <strong className="text-admin-text">WhatsApp di HP</strong> → Ketuk ⋮ → <strong className="text-admin-text">Linked Devices</strong> → <strong className="text-admin-text">Link a Device</strong></li>
              <li><strong className="text-admin-text">Scan QR Code</strong> dari halaman Fonnte</li>
              <li>Tunggu sampai status <strong className="text-success">Connected ✅</strong></li>
              <li>Klik device → <strong className="text-admin-text">Salin Token</strong> yang muncul</li>
              <li>Paste token di field di atas → Simpan → Kirim Test</li>
            </ol>
          </div>

          {/* Notification Templates Info */}
          <div className="p-4 rounded-admin bg-admin-bg-sidebar border border-admin-border">
            <h3 className="text-sm font-semibold text-admin-text mb-2">📨 Template Notifikasi Otomatis</h3>
            <div className="text-xs text-admin-text-muted space-y-2">
              <div>
                <span className="text-admin-text font-medium">1. Donasi Berhasil</span>
                <p className="mt-0.5">Dikirim otomatis ke donatur setelah pembayaran berhasil</p>
              </div>
              <div>
                <span className="text-admin-text font-medium">2. Reset Password</span>
                <p className="mt-0.5">Kode OTP dikirim ke WhatsApp user saat lupa password</p>
              </div>
              <div>
                <span className="text-admin-text font-medium">3. Penarikan Dana</span>
                <p className="mt-0.5">Notifikasi ke admin saat ada penarikan dana baru</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

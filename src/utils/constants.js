/** Nominal cepat untuk form donasi */
export const QUICK_AMOUNTS = [
  { label: 'Rp 25rb', value: 25000 },
  { label: 'Rp 50rb', value: 50000 },
  { label: 'Rp 100rb', value: 100000 },
  { label: 'Rp 250rb', value: 250000 },
  { label: 'Rp 500rb', value: 500000 },
  { label: 'Rp 1 Jt', value: 1000000 },
];

/** Minimum donasi */
export const MIN_DONATION = 1000;

/** Kategori kampanye */
export const CAMPAIGN_CATEGORIES = [
  { value: 'infaq', label: 'Infaq' },
  { value: 'wakaf', label: 'Wakaf' },
  { value: 'yatim', label: 'Yatim Piatu' },
  { value: 'bencana', label: 'Bencana Alam' },
  { value: 'kemanusiaan', label: 'Kemanusiaan' },
];


/** Navigasi user */
export const USER_NAV_ITEMS = [
  { label: 'Beranda', path: '/' },
  { label: 'Jelajahi', path: '/explore' },
];

/** Navigasi admin sidebar */
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin-panel/dashboard', icon: 'LayoutDashboard' },
  { label: 'Kampanye', path: '/admin-panel/campaigns', icon: 'Megaphone' },
  { label: 'Transaksi', path: '/admin-panel/transactions', icon: 'CreditCard' },
  { label: 'Penarikan', path: '/admin-panel/withdrawals', icon: 'Wallet' },
  { label: 'Pengaturan', path: '/admin-panel/settings', icon: 'Settings' },
];

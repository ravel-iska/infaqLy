/**
 * Format angka ke format rupiah Indonesia
 * @param {number} amount
 * @returns {string} contoh: "Rp 1.250.000"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp').trim();
}

/**
 * Format angka ke singkatan (Jt, Rb)
 * @param {number} amount
 * @returns {string} contoh: "245.8 Jt"
 */
export function formatCurrencyShort(amount) {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${amount}`;
}

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date  
 * @returns {string} contoh: "14 April 2026"
 */
export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal singkat
 * @param {string|Date} date
 * @returns {string} contoh: "14 Apr 2026"
 */
export function formatDateShort(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format waktu relatif (berapa lama lalu)
 * @param {string|Date} date
 * @returns {string} contoh: "2 jam lalu"
 */
export function formatTimeAgo(date) {
  if (!date) return '-';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return formatDateShort(date);
}


/**
 * Format tanggal + jam lengkap
 * @param {string|Date} date
 * @returns {string} contoh: "14 Apr 2026, 10:30 WIB"
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  const tanggal = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${tanggal}, ${jam} WIB`;
}


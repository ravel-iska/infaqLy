import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

/**
 * Generate sertifikat donasi sebagai HTML dan buka di tab baru untuk di-print/save as PDF
 * @param {Object} params
 * @param {string} params.donorName - Nama donatur
 * @param {string} params.program - Nama program donasi
 * @param {number} params.amount - Nominal donasi
 * @param {string} params.date - Tanggal donasi
 * @param {string|number} params.transactionId - ID transaksi
 */
export function generateCertificate({ donorName, program, amount, date, transactionId }) {
  const formattedDate = formatDate(date);
  const formattedAmount = formatCurrency(amount);
  const certNumber = `CERT-${transactionId}-${new Date(date).getFullYear()}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sertifikat Donasi - ${certNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f8faf5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .certificate {
      width: 297mm;
      max-width: 1100px;
      aspect-ratio: 297 / 210;
      background: #fff;
      border-radius: 16px;
      border: 3px solid #10B981;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 80px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
    }

    /* Corner ornaments */
    .certificate::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 120px; height: 120px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      clip-path: polygon(0 0, 100% 0, 0 100%);
      opacity: 0.15;
    }
    .certificate::after {
      content: '';
      position: absolute;
      bottom: 0; right: 0;
      width: 120px; height: 120px;
      background: linear-gradient(315deg, #10B981 0%, #059669 100%);
      clip-path: polygon(100% 100%, 0 100%, 100% 0);
      opacity: 0.15;
    }

    .inner-border {
      position: absolute;
      top: 12px; left: 12px; right: 12px; bottom: 12px;
      border: 1px solid #D1FAE5;
      border-radius: 10px;
      pointer-events: none;
    }

    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #1E293B;
      margin-bottom: 8px;
    }
    .logo span { font-size: 32px; }

    .subtitle {
      font-size: 12px;
      color: #64748B;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 36px;
    }

    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #10B981;
      margin-bottom: 24px;
    }

    .message {
      font-size: 14px;
      color: #64748B;
      text-align: center;
      max-width: 500px;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .donor-name {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 8px;
      border-bottom: 3px solid #10B981;
      padding-bottom: 6px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
      margin-bottom: 36px;
      width: 100%;
      max-width: 600px;
    }

    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 11px;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
    }
    .detail-value.accent {
      color: #10B981;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 600px;
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid #E2E8F0;
    }
    .cert-id {
      font-size: 11px;
      color: #94A3B8;
      font-family: monospace;
    }
    .print-info {
      font-size: 11px;
      color: #94A3B8;
    }

    .btn-print {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 28px;
      background: #10B981;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transition: all 0.2s;
      z-index: 100;
    }
    .btn-print:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    @media print {
      body { background: none; padding: 0; }
      .certificate { box-shadow: none; border-radius: 0; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="inner-border"></div>
    
    <div class="logo"><span>🕌</span> infaqLy</div>
    <div class="subtitle">Platform Donasi Infaq & Wakaf Digital</div>
    
    <div class="title">Sertifikat Donasi</div>
    
    <div class="message">
      Dengan ini kami menyatakan bahwa yang bersangkutan telah menyalurkan donasi melalui platform infaqLy:
    </div>
    
    <div class="donor-name">${donorName}</div>
    
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-label">Program</div>
        <div class="detail-value">${program}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Nominal</div>
        <div class="detail-value accent">${formattedAmount}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Tanggal</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
    </div>

    <div class="footer">
      <div class="cert-id">${certNumber}</div>
      <div class="print-info">Dicetak pada ${formatDate(new Date())}</div>
    </div>
  </div>

  <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
</body>
</html>
  `.trim();

  // Open in new tab
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  } else {
    // Fallback: download as HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sertifikat-${certNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

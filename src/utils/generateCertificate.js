import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

/**
 * Generate sertifikat donasi sebagai HTML dan buka di tab baru untuk di-print/save as PDF
 * Desain: Clean, modern, minimalis — mudah dibaca & enak dipandang
 */
export function generateCertificate({ donorName, program, amount, date, transactionId }) {
  const formattedDate = formatDate(date);
  const formattedAmount = formatCurrency(amount);
  const certNumber = `CERT-${transactionId}-${new Date(date).getFullYear()}`;
  const printDate = formatDate(new Date());

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kuitansi Donasi - ${certNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      margin: 0.5cm;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      color: #1e293b;
    }

    .receipt {
      width: 100%;
      max-width: 420px; /* Lebar optimal untuk struk menengah */
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06);
    }

    /* Green Header Strip */
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
      padding: 24px 24px 16px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 16px;
      background: #fff;
      border-radius: 16px 16px 0 0;
    }

    .brand {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: rgba(255,255,255,0.95);
      letter-spacing: -0.5px;
    }
    .brand-icon { font-size: 22px; vertical-align: middle; margin-right: 4px; }

    .header-title {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.85);
      margin-top: 6px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* Body */
    .body {
      padding: 16px 24px 24px;
    }

    /* Success Badge */
    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 100px;
      margin-bottom: 20px;
    }

    /* Donor Section */
    .donor-section {
      text-align: center;
      margin-bottom: 20px;
    }
    .donor-label {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }
    .donor-name {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    /* Amount Highlight */
    .amount-box {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .amount-value {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #059669;
      letter-spacing: -1px;
    }

    /* Detail Rows */
    .details {
      border-top: 1px dashed #e2e8f0;
      padding-top: 16px;
      margin-bottom: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 0;
      gap: 12px;
    }
    .detail-row + .detail-row {
      border-top: 1px solid #f8fafc;
    }
    .detail-key {
      font-size: 12px;
      font-weight: 500;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .detail-val {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      text-align: right;
      word-break: break-word;
    }

    /* Footer */
    .footer {
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      text-align: center;
    }
    .footer-text {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }
    .footer-text strong {
      color: #64748b;
    }

    /* Thank You Message */
    .thankyou {
      text-align: center;
      padding: 8px 0 0;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      line-height: 1.5;
    }
    .thankyou em {
      display: block;
      font-style: normal;
      font-size: 16px;
      margin-top: 4px;
    }

    /* Print Button */
    .btn-print {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: #059669;
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
      transition: all 0.2s;
      z-index: 100;
    }
    .btn-print:hover {
      background: #047857;
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(5, 150, 105, 0.4);
    }

    /* ATURAN SAAT DICETAK ATAU SAVE PDF DI MHP/MOBILE */
    @media print {
      body { 
        background: transparent; 
        padding: 0; 
        margin: 0; 
        min-height: auto; 
        display: block; 
      }
      .receipt { 
        box-shadow: none; 
        max-width: 100%; 
        margin: 0 auto;
        border-radius: 0;
        border: none;
      }
      .btn-print { display: none !important; }
      
      /* Hilangkan border/shadow berlebihan, optimalkan font */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Jangan pecah halaman di elemen ini */
      .header, .body, .details, .amount-box, .footer {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="brand"><span class="brand-icon">🕌</span> infaqLy</div>
      <div class="header-title">Kuitansi Donasi</div>
    </div>

    <!-- Body -->
    <div class="body">
      <div style="text-align:center">
        <span class="success-badge">✓ Pembayaran Berhasil</span>
      </div>

      <!-- Donor -->
      <div class="donor-section">
        <div class="donor-label">Donatur</div>
        <div class="donor-name">${donorName}</div>
      </div>

      <!-- Amount -->
      <div class="amount-box">
        <div class="amount-label">Total Donasi</div>
        <div class="amount-value">${formattedAmount}</div>
      </div>

      <!-- Details -->
      <div class="details">
        <div class="detail-row">
          <span class="detail-key">Program</span>
          <span class="detail-val">${program}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Tanggal Donasi</span>
          <span class="detail-val">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">No. Referensi</span>
          <span class="detail-val" style="font-family:monospace;font-size:11px;color:#94a3b8">${certNumber}</span>
        </div>
      </div>

      <!-- Thank You -->
      <div class="thankyou">
        Jazakallahu khairan atas kebaikan Anda.<br>
        Semoga Allah memberikan balasan berlipat ganda.
        <em>🤲</em>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span class="footer-text">Dicetak pada <strong>${printDate}</strong></span>
      <span class="footer-text"><strong>infaqLy</strong> — Platform Donasi Digital</span>
    </div>
  </div>

  <button class="btn-print" onclick="window.print()">
    🖨️ Cetak / Simpan PDF
  </button>
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
    a.download = `kuitansi-${certNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

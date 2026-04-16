import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(__dirname, '../../tmp');

// Pastikan folder tmp ada
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

interface CertificateData {
  orderId: string;
  donorName: string;
  amount: number;
  programName: string;
  date: Date;
}

export async function generateCertificatePDF(data: CertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `Kuitansi-Donasi-${data.orderId}.pdf`;
    const filePath = path.join(TMP_DIR, filename);

    // Kertas kecil struk A5 (148 x 210 mm) (approx 420 x 595 pixels)
    const doc = new PDFDocument({
      size: 'A5',
      margin: 40,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // -- Header Background (Hijau) --
    doc.rect(0, 0, doc.page.width, 100).fill('#059669');

    // -- Brand Logo/Text --
    doc.fillColor('#ffffff')
       .fontSize(22)
       .text('infaqLy', 40, 30, { align: 'center' });
       
    doc.fontSize(12)
       .fillColor('#d1fae5')
       .text('KUITANSI DONASI DIGITAL', 40, 60, { align: 'center', characterSpacing: 2 });

    // -- Body --
    let cursorY = 120;

    // Status Success
    doc.roundedRect(doc.page.width / 2 - 70, cursorY, 140, 25, 12).fill('#ecfdf5');
    doc.fillColor('#059669')
       .fontSize(10)
       .text(' Pembayaran Berhasil ', doc.page.width / 2 - 70, cursorY + 7, { align: 'center', width: 140 });

    cursorY += 50;

    // Donor
    doc.fillColor('#94a3b8').fontSize(9).text('DONATUR', 40, cursorY, { align: 'center' });
    cursorY += 12;
    doc.fillColor('#0f172a').fontSize(20).text(data.donorName, 40, cursorY, { align: 'center' });

    cursorY += 40;

    // Amount
    doc.roundedRect(40, cursorY, doc.page.width - 80, 70, 10).fill('#f0fdf4');
    doc.fillColor('#059669').lineWidth(1).roundedRect(40, cursorY, doc.page.width - 80, 70, 10).stroke();
    
    doc.fillColor('#64748b').fontSize(10).text('TOTAL DONASI', 40, cursorY + 15, { align: 'center', width: doc.page.width - 80 });
    
    const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    doc.fillColor('#059669').fontSize(24).text(formatter.format(data.amount), 40, cursorY + 30, { align: 'center', width: doc.page.width - 80 });

    cursorY += 95;

    // Details Box
    doc.fillColor('#64748b').fontSize(10);
    
    // Program
    doc.text('Program:', 40, cursorY);
    doc.fillColor('#334155').text(data.programName.length > 50 ? data.programName.slice(0,47)+'...' : data.programName, 120, cursorY, { align: 'left', width: doc.page.width - 160 });
    cursorY += 25;

    // Date
    doc.fillColor('#64748b').text('Tanggal:', 40, cursorY);
    doc.fillColor('#334155').text(data.date.toLocaleString('id-ID'), 120, cursorY);
    cursorY += 25;

    // Order ID
    doc.fillColor('#64748b').text('No. Ref:', 40, cursorY);
    doc.fillColor('#334155').text(data.orderId, 120, cursorY);

    cursorY += 40;

    // Line separator
    doc.moveTo(40, cursorY).lineTo(doc.page.width - 40, cursorY).dash(2, { space: 4 }).stroke('#e2e8f0');
    doc.undash(); // reset dash

    cursorY += 20;

    // Thank you
    doc.fillColor('#64748b').fontSize(10).text('Jazakallahu khairan atas kebaikan Anda.', 40, cursorY, { align: 'center' });
    cursorY += 15;
    doc.text('Semoga Allah memberikan balasan berlipat ganda.', 40, cursorY, { align: 'center' });

    // Footer
    doc.fillColor('#94a3b8').fontSize(8).text('Platform Donasi Digital - infaqLy.com', 40, doc.page.height - 30, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

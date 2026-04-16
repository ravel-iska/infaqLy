import { Request, Response, NextFunction } from 'express';
import { sendErrorAlert } from '../services/whatsapp.service.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  if (err.message.includes('Format file tidak didukung')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('File too large')) {
    return res.status(400).json({ error: 'Ukuran file melebihi batas maksimal' });
  }

  // Jika error adalah error internal server 500, kirim alert WA ke admin
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd || true) {
    const endpoint = `${req.method} ${req.originalUrl}`;
    sendErrorAlert(endpoint, err.message).catch(() => {});
  }

  return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
}

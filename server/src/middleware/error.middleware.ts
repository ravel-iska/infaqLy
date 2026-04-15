import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  if (err.message.includes('Format file tidak didukung')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('File too large')) {
    return res.status(400).json({ error: 'Ukuran file melebihi batas maksimal' });
  }

  return res.status(500).json({ error: 'Terjadi kesalahan internal server' });
}

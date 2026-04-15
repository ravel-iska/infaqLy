import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// POST /api/upload/image — generic image upload
router.post('/image', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File diperlukan' });
  const b64 = req.file.buffer.toString('base64');
  const url = `data:${req.file.mimetype};base64,${b64}`;
  return res.json({ url, filename: req.file.originalname });
});

export default router;

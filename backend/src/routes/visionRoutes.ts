import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { analyzeHandler, askHandler, healthHandler } from '../controllers/visionController.js';

const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image type. Use JPEG, PNG, or WebP.'));
    }
  },
});

const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many vision requests. Slow down capture or increase the interval.',
    code: 'RATE_LIMITED',
  },
});

const router = Router();

router.get('/health', healthHandler);
router.post('/analyze', visionLimiter, upload.single('image'), analyzeHandler);
router.post('/ask', visionLimiter, upload.single('image'), askHandler);

export default router;

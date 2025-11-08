// Goal: Define capture routes for text, link, and file input
// Routes: POST /api/capture (text), POST /api/capture/link, POST /api/capture/file
// All routes require authentication

import express from 'express';
import multer from 'multer';
import { captureText } from '../controllers/capture.js';
import { captureLink } from '../controllers/capture-link.js';
import { captureFile } from '../controllers/capture-file.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Setup multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require authentication
router.use(requireAuth);

// POST /api/capture - Capture text
router.post('/', captureText);

// POST /api/capture/link - Capture link/URL
router.post('/link', captureLink);

// POST /api/capture/file - Capture file upload
router.post('/file', upload.single('file'), captureFile);

export default router;


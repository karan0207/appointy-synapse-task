// Goal: Semantic search routes
// POST /api/search - Search items by natural language query
// All routes require authentication

import express from 'express';
import { semanticSearch } from '../controllers/search.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/search - Semantic search
router.post('/', semanticSearch);

export default router;


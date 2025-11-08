// Goal: Routes for embedding management
// POST /api/embeddings - Store embedding from worker

import express from 'express';
import { storeItemEmbedding } from '../controllers/embeddings.js';

const router = express.Router();

// POST /api/embeddings - Store embedding for an item
router.post('/', storeItemEmbedding);

export default router;


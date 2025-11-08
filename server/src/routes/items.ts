// Goal: Define routes for retrieving items
// Routes: GET /api/items
// All routes require authentication

import express from 'express';
import { getItems } from '../controllers/items.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/items - Get all items for a user
router.get('/', getItems);

export default router;


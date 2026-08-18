import express from 'express';
import { handleClaude } from '../controllers/claude.controller.js';

const router = express.Router();

// POST /api/claude/generate
router.post('/generate', handleClaude);

export default router;

import express from 'express';
import { createStory, getStories } from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getStories);
router.post('/', protect, createStory);

export default router;

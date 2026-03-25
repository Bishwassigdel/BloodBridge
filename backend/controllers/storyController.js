import Story from '../models/Story.js';

// POST /api/stories — create a new story (protected)
export const createStory = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Story message is required' });
  }
  if (message.trim().length < 20) {
    return res.status(400).json({ success: false, message: 'Story must be at least 20 characters' });
  }

  try {
    // Replace previous story if user already has one
    const story = await Story.findOneAndUpdate(
      { author: req.user._id },
      {
        name: req.user.username,
        role: req.user.role,
        title: title.trim(),
        message: message.trim(),
        location: req.user.location || '',
        avatar: req.user.avatar || null,
        updatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, message: 'Story shared successfully!', story });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ success: false, message: 'Server error while saving story' });
  }
};

// GET /api/stories — fetch all stories (public)
export const getStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, stories });
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching stories' });
  }
};

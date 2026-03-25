import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['donor', 'receiver', 'hospital'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  avatar: { type: String, default: null },
}, { timestamps: true });

const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

export default Story;

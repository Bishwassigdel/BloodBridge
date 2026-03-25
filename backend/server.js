// server.js (main backend file)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import bloodRoutes from './routes/blood.js';
import notificationRoutes from './routes/notification.js';
import storyRoutes from './routes/story.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',     // Vite default
    'http://localhost:3000',     // possible React CRA
    process.env.FRONTEND_URL     // production (add in .env)
  ].filter(Boolean),
  credentials: true,
}));

// ── Security Headers for Google Sign-In ─────────────────────────────────
// Fix: Cross-Origin-Opener-Policy warning when using Google OAuth popup
app.use((req, res, next) => {
  // Allow popups from Google Sign-In to communicate back to parent window
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Allow cross-origin resources if they have proper headers
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── MongoDB Connection (modern - no deprecated options) ─────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

connectDB();

// ── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);

// ── Health Check / Root ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BloodBridge Backend is running!',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Not Found Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── Start Server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ── Graceful Shutdown ───────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});
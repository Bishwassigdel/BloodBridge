// server.js (main backend file)
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import bloodRoutes from './routes/blood.js';
import notificationRoutes from './routes/notification.js';
import storyRoutes from './routes/story.js';
import eventRoutes from './routes/event.js';

// SSE
import { addSSEClient, removeSSEClient } from './sse.js';
import jwt from 'jsonwebtoken';
import User from './models/user.js';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────
// Gzip all responses — reduces payload by 60-70% (compression was installed but never wired up)
app.use(compression({
  level: 6,           // sweet-spot between speed and ratio
  threshold: 1024,    // only compress responses > 1 KB
  filter: (req, res) => {
    // Don't compress SSE streams — they must stay as raw text/event-stream
    if (req.path === '/api/sse') return false;
    return compression.filter(req, res);
  },
}));

app.use(cors({
  origin: [
    'http://localhost:5173',     // Vite default
    'http://localhost:3000',     // possible React CRA
    process.env.FRONTEND_URL     // production (add in .env)
  ].filter(Boolean),
  credentials: true,
}));

// ── Security Headers for Google Sign-In ─────────────────────────────────
// Allows Google OAuth popup to post messages back to the opener window
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Note: Do NOT set Cross-Origin-Embedder-Policy here — it blocks Google OAuth
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (avatars, etc.) — cache images in browser for 7 days
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '7d',
  immutable: false,
  etag: true,
  lastModified: true,
}));

// ── MongoDB Connection (modern - no deprecated options) ─────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging 30s
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

connectDB();

// ── SSE Endpoint ─────────────────────────────────────────────────────────
// Real-time push: donors get instant SOS alerts, receivers get donor-found updates
// Auth via ?token= query param (EventSource doesn't support headers)
app.get('/api/sse', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: 'No token' });

    // Verify JWT
    const decoded = jwt.verify(token.replace(/^["']+|["']+$/g, '').trim(), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role bloodGroup username').lean();
    if (!user) return res.status(401).json({ message: 'User not found' });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Register client
    addSSEClient(user._id, res, user.bloodGroup, user.role);

    // Send connected confirmation
    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user._id, role: user.role })}\n\n`);

    // Heartbeat every 25 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch (_) {}
    }, 25000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      removeSSEClient(user._id);
    });
  } catch (err) {
    console.error('[SSE] Auth error:', err.message);
    res.status(401).end();
  }
});

// ── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/events', eventRoutes);

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
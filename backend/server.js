// // server.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import authRoutes from './routes/auth.js';

// dotenv.config();

// const app = express();

// // FIX 1: Proper CORS for Vite (port 5173)
// app.use(cors({
//   origin: 'http://localhost:5173', // Vite default port
//   credentials: true
// }));

// app.use(express.json());

// // Connect to DB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log('DB Error:', err));

// // Routes
// app.use('/api/auth', authRoutes);

// // Health check
// app.get('/', (req, res) => {
//   res.json({ message: 'BloodBridge Backend Running!' });
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

// CORS for Vite
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// OPTIMIZED MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,                 // Good for concurrent requests
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4                        // Force IPv4 (faster on Mac)
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('DB Error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'BloodBridge Backend Running Fast!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
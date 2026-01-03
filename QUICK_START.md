# 🚀 Quick Start Guide - BloodConnect Login & Signup

## ✅ What's Been Set Up

### Backend (Node.js + Express + MongoDB)
- ✅ User model with password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Signup endpoint: `POST /api/auth/signup`
- ✅ Login endpoint: `POST /api/auth/login`
- ✅ CORS configured for frontend
- ✅ MongoDB connection

### Frontend (React + TypeScript)
- ✅ Beautiful Login page (`/login`)
- ✅ Complete Signup page (`/signup`) with all fields
- ✅ Home page with user profile (`/`)
- ✅ Routing with React Router
- ✅ API service connected to backend
- ✅ Protected routes
- ✅ Token storage in localStorage

## 📋 Setup Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if not done)
npm install

# Create .env file
# Copy this content into backend/.env:
```

Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/bloodconnect
JWT_SECRET=your-secret-key-change-in-production-make-it-long-and-random
PORT=5000
```

```bash
# Make sure MongoDB is running
# Then start the backend:
npm run dev
# or
npm start
```

Backend will run on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start the frontend:
npm run dev
```

Frontend will run on: `http://localhost:5173` (or another port)

## 🎯 How to Use

1. **Start MongoDB** (if not running)
   ```bash
   mongod
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open Browser**
   - Go to `http://localhost:5173`
   - Click "Sign Up" to create an account
   - Fill in all fields (Name, Email, Blood Group, Phone, Location, Password)
   - After signup, you'll be logged in automatically
   - Click "Logout" to log out
   - Click "Login" to log back in

## 📝 Signup Form Fields

- **Full Name** - Required
- **Email** - Required, must be unique
- **Blood Group** - Required (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Phone Number** - Required
- **Location** - Required
- **Password** - Required, minimum 6 characters
- **Confirm Password** - Required, must match password

## 🔗 API Endpoints

### Signup
```
POST http://localhost:5000/api/auth/signup
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "bloodGroup": "O+",
  "phone": "1234567890",
  "location": "New York"
}
```

### Login
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running: `mongosh` or `mongod`
- Verify `.env` file exists in `backend/` folder
- Check if port 5000 is available

**Frontend can't connect to backend:**
- Make sure backend is running on port 5000
- Check browser console for CORS errors
- Verify API URL in `frontend/src/services/api.ts`

**Database connection error:**
- Make sure MongoDB is installed and running
- Check `MONGODB_URI` in `.env` file
- Try: `mongosh` to test MongoDB connection

**"User already exists" error:**
- The email is already registered
- Try a different email or login instead

## ✨ Features

- ✅ Secure password hashing
- ✅ JWT token authentication
- ✅ Form validation
- ✅ Error handling
- ✅ Responsive design
- ✅ Auto-redirect after login/signup
- ✅ Protected routes
- ✅ User profile display

## 🎨 Pages

- **`/`** - Home page (shows profile if logged in)
- **`/login`** - Login page
- **`/signup`** - Signup page

All set! Your login and signup system is ready to use! 🎉


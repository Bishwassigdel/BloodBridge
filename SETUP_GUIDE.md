# BloodConnect - Login & Signup Setup Guide

## 📋 Overview

This guide will help you set up and run the login and signup functionality for your BloodConnect application.

## 🏗️ Project Structure

```
BloodConnect/
├── backend/          # Node.js/Express backend
│   ├── config/       # Database configuration
│   ├── controllers/  # Auth controllers
│   ├── models/       # User model
│   └── routes/       # API routes
└── frontend/         # React/TypeScript frontend
    ├── src/
    │   ├── pages/    # Login, Signup, Home pages
    │   └── services/ # API service
```

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` folder:

```env
MONGODB_URI=mongodb://localhost:27017/bloodconnect
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

**Important:** Change `JWT_SECRET` to a random string in production!

### 3. Start MongoDB

Make sure MongoDB is running on your system. If not installed:
- **macOS:** `brew install mongodb-community`
- **Windows:** Download from [MongoDB website](https://www.mongodb.com/try/download/community)
- **Linux:** `sudo apt-get install mongodb`

Start MongoDB:
```bash
mongod
```

### 4. Run the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The server will run on `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `react` & `react-dom` - React framework
- `react-router-dom` - Routing
- `typescript` - TypeScript support

### 2. Set Up Environment Variables (Optional)

Create a `.env` file in the `frontend` folder if you want to change the API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the Frontend

```bash
npm run dev
```

The app will run on `http://localhost:5173` (or another port if 5173 is busy)

## 🚀 How It Works

### Backend API Endpoints

1. **POST `/api/auth/signup`** - Register a new user
   - Body: `{ name, email, password, bloodGroup, phone, location }`
   - Returns: `{ success, token, user }`

2. **POST `/api/auth/login`** - Login user
   - Body: `{ email, password }`
   - Returns: `{ success, token, user }`

### Frontend Pages

1. **`/`** - Home page (shows user profile if logged in)
2. **`/login`** - Login page
3. **`/signup`** - Signup page

### Authentication Flow

1. User signs up → Backend creates user → Returns JWT token
2. Token stored in `localStorage`
3. User redirected to home page
4. Protected routes check for token
5. On logout, token is removed

## 📝 Features

✅ User registration with validation
✅ Secure password hashing (bcrypt)
✅ JWT token authentication
✅ Form validation
✅ Error handling
✅ Responsive design
✅ Protected routes
✅ Auto-redirect if already logged in

## 🧪 Testing

1. **Sign Up:**
   - Go to `/signup`
   - Fill in all fields
   - Submit form
   - Should redirect to home page

2. **Login:**
   - Go to `/login`
   - Enter email and password
   - Submit form
   - Should redirect to home page

3. **Logout:**
   - Click logout button on home page
   - Should redirect to login page

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running
- Verify `.env` file exists
- Check if port 5000 is available

**Frontend can't connect to backend:**
- Make sure backend is running
- Check CORS settings
- Verify API URL in `api.ts`

**Database connection error:**
- Ensure MongoDB is installed and running
- Check `MONGODB_URI` in `.env`
- Try: `mongosh` to test MongoDB connection

## 📚 Next Steps

- Add password reset functionality
- Add email verification
- Implement protected API routes
- Add user profile editing
- Add blood request/donation features

## 💡 Tips

- Always use environment variables for sensitive data
- Change JWT_SECRET in production
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting for auth endpoints


// // controllers/authController.js
// import User from '../models/user.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// export const signupUser = async (req, res) => {
//   const { username, email, password, bloodGroup, phone, location, role } = req.body;

//   // Validate role
//   if (!['donor', 'receiver', 'hospital'].includes(role)) {
//     return res.status(400).json({ success: false, message: 'Invalid role. Must be donor, receiver, or hospital' });
//   }

//   // Validate required fields
//   if (!username || !email || !password) {
//     return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
//   }

//   // Validate bloodGroup for donor/receiver
//   if ((role === 'donor' || role === 'receiver') && !bloodGroup) {
//     return res.status(400).json({ success: false, message: 'Blood group is required for donor or receiver' });
//   }

//   if (!location) {
//     return res.status(400).json({ success: false, message: 'Location is required' });
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: 'Email already exists' });
//     }

//     // Smart bcrypt rounds: 8 in dev (fast), 10 in production (secure)
//     const rounds = process.env.NODE_ENV === 'production' ? 10 : 8;
//     const hashedPassword = await bcrypt.hash(password, rounds);

//     const newUser = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       bloodGroup: (role === 'donor' || role === 'receiver') ? bloodGroup : undefined,
//       phone: phone || '',
//       location,
//       role
//     });

//     const token = jwt.sign(
//       { id: newUser._id, role: newUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     const userResponse = {
//       id: newUser._id,
//       username: newUser.username,
//       email: newUser.email,
//       role: newUser.role,
//       bloodGroup: newUser.bloodGroup,
//       phone: newUser.phone,
//       location: newUser.location
//     };

//     res.status(201).json({
//       success: true,
//       token,
//       user: userResponse
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({ success: false, message: 'Server error during registration' });
//   }
// };

// export const loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ success: false, message: 'Email and password are required' });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ success: false, message: 'Invalid email or password' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: 'Invalid email or password' });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     const userResponse = {
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       role: user.role,
//       bloodGroup: user.bloodGroup,
//       phone: user.phone,
//       location: user.location
//     };

//     res.json({
//       success: true,
//       token,
//       user: userResponse
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ success: false, message: 'Server error during login' });
//   }
// };

// controllers/authController.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signupUser = async (req, res) => {
  const { username, email, password, bloodGroup, phone, location, role } = req.body;

  // Validate role
  if (!['donor', 'receiver', 'hospital'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  // Validate required fields
  if (!username || !email || !password || !location) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  // Validate bloodGroup for donor/receiver
  if ((role === 'donor' || role === 'receiver') && !bloodGroup) {
    return res.status(400).json({ success: false, message: 'Blood group required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // OPTIMIZED: Smart bcrypt rounds - 6 in dev (fast), 10 in production (secure)
    const rounds = process.env.NODE_ENV === 'production' ? 10 : 6;
    const hashedPassword = await bcrypt.hash(password, rounds);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      bloodGroup: role !== 'hospital' ? bloodGroup : undefined,
      phone: phone || '',
      location,
      role
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      bloodGroup: newUser.bloodGroup,
      phone: newUser.phone,
      location: newUser.location
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      bloodGroup: user.bloodGroup,
      phone: user.phone,
      location: user.location
    };

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
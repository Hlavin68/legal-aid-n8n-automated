import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const sendAuthResponse = (res, user) => {
  const token = createToken(user);

  const userData = user.toObject ? user.toObject() : { ...user };
  delete userData.password;

  return res.status(200).json({
    success: true,
    token,
    user: userData
  });
};

export const register = async (req, res) => {
  const { name, email, password, role, firm, licenseNumber, username } = req.body;

  try {
    const normalizedRole = String(role || '').toLowerCase();

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = await User.create({
      name,
      email: email?.toLowerCase(),
      password,
      role: normalizedRole,
      firm: firm || null,
      licenseNumber: licenseNumber || null,
      username: username || null
    });

    return sendAuthResponse(res, newUser);
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      'Registration failed';

    return res.status(400).json({ error: errorMessage });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch current user' });
  }
};

export const updateProfile = async (req, res) => {
  const updates = { ...req.body };

  if (updates.password) {
    delete updates.password;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    return res.status(400).json({ error: 'Profile update failed' });
  }
};
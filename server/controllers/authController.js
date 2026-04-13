import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_EXPIRE = '7d';

const getJWTSecret = () => process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    getJWTSecret(),
    { expiresIn: JWT_EXPIRE }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, firm, licenseNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, password, role'
      });
    }

    if (!['client', 'lawyer'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either "client" or "lawyer"'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      firm: role === 'lawyer' ? firm : null,
      licenseNumber: role === 'lawyer' ? licenseNumber : null
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, firm, licenseNumber, profileImage } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(firm && { firm }),
        ...(licenseNumber && { licenseNumber }),
        ...(profileImage && { profileImage })
      },
      { new: true }
    );

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

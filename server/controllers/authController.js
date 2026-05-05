import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

export const getUsers = async (req, res) => {
  try {
    // Only lawyers and admins can view users for assignment
    if (!['lawyer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User.find({ 
      role: { $in: ['lawyer', 'paralegal'] },
      _id: { $ne: req.user.id } // Exclude current user
    }).select('name email role firm licenseNumber username');

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch users' });
  }
};

// Forgot Password - Generate reset token
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link will be sent.' 
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset link (frontend will append token to this URL)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // TODO: Send email with reset link
    // For now, log it (in production, use SendGrid, Nodemailer, etc.)
    console.log(`Password Reset Link: ${resetLink}`);

    // Return success message (don't expose token in response for security)
    return res.status(200).json({ 
      success: true, 
      message: 'Password reset link has been sent to your email',
      // Remove in production - only for testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Unable to process password reset request' });
  }
};

// Validate Reset Token - Check if token is valid
export const validateResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    // Find user with this token (hashed)
    const user = await User.findOne({ 
      resetPasswordToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Check if token is expired
    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Token is valid
    return res.status(200).json({ 
      success: true, 
      message: 'Token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ error: 'Unable to validate reset token' });
  }
};

// Reset Password - Set new password with valid token
export const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  try {
    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Token, password, and password confirmation are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user with valid reset token
    const user = await User.findOne({ 
      resetPasswordToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Check if token is expired
    if (user.resetPasswordExpire < Date.now()) {
      // Clear expired token
      user.clearResetToken();
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // Update password
    user.password = password;
    user.clearResetToken();
    await user.save();

    // Return success with auth token
    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
};
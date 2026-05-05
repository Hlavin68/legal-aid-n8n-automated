import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['client', 'lawyer', 'paralegal', 'admin'],
      required: [true, 'Role is required']
    },
    username: {
      type: String,
      default: null
    },
    firm: {
      type: String,
      default: null
    },
    licenseNumber: {
      type: String,
      default: null
    },
    profileImage: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpire: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and store it
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expiration to 1 hour from now
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  
  // Return the unhashed token to be sent to user
  return resetToken;
};

// Method to validate reset token
userSchema.methods.validateResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and hasn't expired
  return (
    this.resetPasswordToken === hashedToken &&
    this.resetPasswordExpire > Date.now()
  );
};

// Method to clear reset token
userSchema.methods.clearResetToken = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpire = null;
};

// Method to get user without sensitive data

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);

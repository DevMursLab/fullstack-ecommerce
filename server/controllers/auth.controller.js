const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
} = require('../utils/validators');

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}

// @route POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    const { isValid, errors } = validateRegisterInput({ name, email, phone, password });
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      password: hashedPassword,
    });

    const token = generateToken(user);
    res.status(201).json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { isValid, errors } = validateLoginInput({ email, password });
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.status(200).json({ success: true, token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/logout
async function logout(req, res) {
  // stateless JWT — client discards the token
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

// @route GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/auth/profile
async function updateProfile(req, res, next) {
  try {
    const { name, phone, addresses, favouriteStaff } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses !== undefined) user.addresses = addresses;
    if (favouriteStaff !== undefined) user.favouriteStaff = favouriteStaff;

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { isValid, errors } = validateChangePasswordInput({ currentPassword, newPassword });
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};

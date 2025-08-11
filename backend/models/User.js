const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Make password optional for Clerk users
  role: { type: String, enum: ['user', 'clerk', 'admin'], default: 'user' },
  clerkId: { type: String, sparse: true, unique: true }, // Add clerkId field
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password || this.password.startsWith('clerk_managed_')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  if (!this.password || this.password.startsWith('clerk_managed_')) {
    return false; // Clerk users can't login with password
  }
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
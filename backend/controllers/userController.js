const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { emitToAdmin, emitToUsers } = require('../middleware/realtime');

// Get all users with filtering and pagination
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      isActive, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or phone already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive: true
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    emitToAdmin('user-created', userResponse);
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    emitToAdmin('user-updated', user);
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email or phone already exists' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { isActive: false, updatedAt: new Date() }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    emitToAdmin('user-deleted', { id: req.params.id });
    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Permanently delete user
const permanentDeleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    emitToAdmin('user-permanently-deleted', { id: req.params.id });
    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate/Deactivate user
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    emitToAdmin('user-status-changed', userResponse);
    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile (for authenticated user)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile (for authenticated user)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { password, role, ...updateData } = req.body; // Prevent role change via profile update
    
    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email or phone already exists' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          },
          inactiveUsers: { 
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } 
          },
          adminUsers: { 
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } 
          },
          clerkUsers: { 
            $sum: { $cond: [{ $eq: ['$role', 'clerk'] }, 1, 0] } 
          },
          regularUsers: { 
            $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } 
          }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: stats[0] || {},
      roleStats,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk operations
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updateData } = req.body;
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { ...updateData, updatedAt: new Date() }
    );

    emitToAdmin('users-bulk-updated', { userIds, updateData });
    res.json({ 
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  permanentDeleteUser,
  toggleUserStatus,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserStats,
  bulkUpdateUsers
};
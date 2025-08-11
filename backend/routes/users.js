const express = require('express');
const { optionalAuth, adminAuth } = require('../middleware/auth');
const {
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
} = require('../controllers/userController');

const router = express.Router();

// Public routes (made public for demo)
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.post('/', createUser);

// User profile routes
router.get('/profile', optionalAuth, getUserProfile);
router.put('/profile', optionalAuth, updateUserProfile);
router.put('/change-password', optionalAuth, changePassword);

// User management routes (made public for demo)
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.delete('/:id/permanent', permanentDeleteUser);
router.put('/:id/toggle-status', toggleUserStatus);
router.patch('/bulk-update', bulkUpdateUsers);

module.exports = router;
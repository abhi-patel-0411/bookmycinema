const express = require('express');
const { optionalAuth, adminAuth } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserProfile,
  updateUserProfile,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// Public routes (made public for demo)
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.post('/', createUser);

// User profile routes
router.get('/profile', optionalAuth, getUserProfile);
router.put('/profile', optionalAuth, updateUserProfile);

// User management routes (made public for demo)
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/toggle-status', toggleUserStatus);

module.exports = router;
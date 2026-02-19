const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');


router.get('/', protect, authorize('admin'), (req, res) => {
  res.json({ users: [] });
});


router.get('/:id', protect, (req, res) => {
  res.json({ user: req.params.id });
});


router.put('/:id', protect, (req, res) => {
  res.json({ success: true, message: 'User updated' });
});


router.delete('/:id', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'User deleted' });
});

module.exports = router;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: `Role ${req.user.role} not authorized` 
    });
  }
  next();
};

const familyAccess = async (req, res, next) => {
  try {
    const targetId = req.params.userId || req.body.userId;
    if (!targetId || targetId === req.user._id.toString()) return next();

    const isFamilyAdmin = req.user.role === 'family-admin' && req.user.familyMembers.includes(targetId);
    const isCaregiver = req.user.role === 'caregiver'; // Add actual check here
    
    if (isFamilyAdmin || isCaregiver) return next();
    
    return res.status(403).json({ message: 'Not authorized to access this user data' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, authorize, familyAccess };
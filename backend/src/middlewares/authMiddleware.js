const supabase = require('../config/supabase');

const authMiddleware = {
  // 1. Check if the user is logged in
  verifyToken: async (req, res, next) => {
    // Get the token from the headers sent by React
    const token = req.headers.authorization?.split(' ')[1]; 
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
      // Ask Supabase if this token is real
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }

      // Fetch the user's role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Attach the user info to the request so controllers can use it
      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'viewer'
      };

      next(); // Move on to the controller
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
  },

  // 2. Check if the user has a specific role
  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden: You do not have permission to perform this action.' 
        });
      }
      next();
    };
  }
};

module.exports = authMiddleware;
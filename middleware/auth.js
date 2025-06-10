// Authentication middleware
// This is a simple implementation. In production, use JWT or other secure token methods

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: true, message: 'Access token required' });
  }
  
  // In a real application, verify the token against a database or using JWT
  // For this example, we'll just check if a token exists
  
  // Add user info to request object
  req.user = {
    // This would normally be decoded from the token
    id: 1,
    role: 'admin'
  };
  
  next();
}

// Check if user is an admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: true, message: 'Admin access required' });
  }
  
  next();
}

module.exports = { authenticateToken, isAdmin };
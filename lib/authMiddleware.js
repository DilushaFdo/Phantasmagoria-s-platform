const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Check the incoming request's headers for the Authorization header
  const authHeader = req.headers.authorization;

  // 2. Extract the token. If there is no token, reject with 401 Unauthorized
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 3. Use jwt.verify() using JWT_SECRET from process.env to crack the token open
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Extract the user's ID from it and attach it to req.user
    req.user = decodedToken.id;
    
    // 5. Call next() to let the user proceed
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = authMiddleware;
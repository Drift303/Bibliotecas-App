module.exports = function roleGuard(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const role = req.user && req.user.role;
      if (!role) return res.status(401).json({ error: 'Missing role in token' });
      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return next();
      if (!allowedRoles.includes(role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
      return next();
    } catch (err) {
      console.error('roleGuard error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

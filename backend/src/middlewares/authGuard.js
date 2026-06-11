const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');

const authGuard = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const payload = jwt.verify(token, secret);
    // attach minimal user info
    req.user = { id: payload.userId, role: payload.role, tenantId: payload.tenantId };
    req.tenantId = payload.tenantId;
    // optional: fetch fresh user to ensure exists
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.userDb = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authGuard;

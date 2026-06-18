const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginSchema } = require('../validators/authValidators');

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { identifier, password } = parsed.data;

    let user = null;
    let tenant = null;

    if (identifier.includes('@')) {
      const domain = identifier.split('@')[1].toLowerCase();
      tenant = await prisma.tenant.findUnique({ where: { emailDomain: domain } });
      if (!tenant) return res.status(401).json({ error: 'Tenant not recognized for domain' });
      user = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: identifier.toLowerCase() } });
    } else {
      // treat as CCT code, find user by cct
      user = await prisma.user.findFirst({ where: { cct: identifier } });
      if (user) tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!tenant) return res.status(401).json({ error: 'Tenant not found' });
    if (tenant.status === 'SUSPENDED') return res.status(403).json({ error: 'Tenant suspended' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { userId: user.id, tenantId: tenant.id, role: user.role };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

   res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 3600 * 1000,
});

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, tenant: { id: tenant.id, name: tenant.name } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
};

module.exports = { login, logout };

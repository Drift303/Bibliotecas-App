const prisma = require('../config/prismaClient');

const saasGuard = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || (req.body && req.body.tenantId);
    if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    if (tenant.status === 'SUSPENDED') return res.status(403).json({ error: 'Tenant suspended' });

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error('saasGuard error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = saasGuard;

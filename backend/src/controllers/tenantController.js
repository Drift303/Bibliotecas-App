const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  createTenantSchema,
  createLibrarianSchema,
  updateTenantStatusSchema,
} = require('../validators/tenantValidators');
const { sendTempPasswordEmail } = require('../services/emailService');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[crypto.randomInt(chars.length)]).join('');
};

const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: tenants });
  } catch (err) {
    console.error('getTenants error', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

const createTenant = async (req, res) => {
  try {
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { name, emailDomain } = parsed.data;

    const existing = await prisma.tenant.findUnique({ where: { emailDomain: emailDomain.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Ese dominio ya está registrado' });

    const created = await prisma.tenant.create({
      data: { name: name.trim(), emailDomain: emailDomain.toLowerCase() },
    });

    console.log(`[AUDIT] superadmin ${req.user.id} creó tenant ${created.id} (${created.name})`);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('createTenant error', err);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};

const createLibrarianForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const parsed = createLibrarianSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const data = parsed.data;
    const existingEmail = await prisma.user.findFirst({ where: { tenantId, email: data.email.toLowerCase() } });
    if (existingEmail) return res.status(400).json({ error: 'Ese email ya existe en el plantel' });

    let tempPassword = null;
    let passwordHash;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    } else {
      tempPassword = generateTempPassword();
      passwordHash = await hashPassword(tempPassword);
    }

    const created = await prisma.user.create({
      data: {
        tenantId,
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        role: 'librarian', // fijo desde el backend, nunca desde el body
        password: passwordHash,
      },
    });

    const { password, ...userWithoutPassword } = created;
    const responseData = tempPassword ? { ...userWithoutPassword, tempPassword } : userWithoutPassword;

    if (tempPassword) {
      sendTempPasswordEmail({
        name: created.name,
        email: created.email,
        tempPassword,
      }).then((result) => {
        if (!result.success) {
          console.warn('No se pudo enviar correo de bienvenida:', result.error);
        } else {
          console.log('Correo de bienvenida enviado a:', created.email);
        }
      });
    }

    console.log(`[AUDIT] superadmin ${req.user.id} creó bibliotecario ${created.id} en tenant ${tenantId}`);
    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    console.error('createLibrarianForTenant error', err);
    res.status(500).json({ error: 'Failed to create librarian' });
  }
};

const updateTenantStatus = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const parsed = updateTenantStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    // Evita que el superadmin se bloquee a sí mismo por accidente
    if (tenantId === req.user.tenantId && parsed.data.status === 'SUSPENDED') {
      return res.status(400).json({ error: 'No puedes suspender tu propio plantel' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: parsed.data.status },
    });

    console.log(`[AUDIT] superadmin ${req.user.id} cambió tenant ${tenantId} a ${parsed.data.status}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateTenantStatus error', err);
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
};

module.exports = { getTenants, createTenant, createLibrarianForTenant, updateTenantStatus };
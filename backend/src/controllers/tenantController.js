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
    const tenants = await prisma.tenant.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tenants });
  } catch (err) {
    console.error('getTenants error', err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// Borrado suave: el plantel deja de listarse y de poder usarse, pero sus
// datos (alumnos, libros, préstamos) no se destruyen — a diferencia de un
// DELETE físico, que por el onDelete: Cascade del schema los borraría
// para siempre. Así se puede auditar o recuperar si fue un error.
const deleteTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.isDeleted) return res.status(404).json({ error: 'Tenant not found' });

    const deleted = await prisma.tenant.update({
      where: { id: tenantId },
      data: { isDeleted: true, status: 'SUSPENDED' },
    });

    console.log(`[AUDIT] superadmin ${req.user.id} eliminó (soft-delete) el tenant ${tenantId} (${tenant.name})`);
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('deleteTenant error', err);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};

const createTenant = async (req, res) => {
  try {
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { name, emailDomain, type } = parsed.data;

    const existing = await prisma.tenant.findUnique({ where: { emailDomain: emailDomain.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Ese dominio ya está registrado' });

    const created = await prisma.tenant.create({
      // Si `type` no viene en el body, Prisma aplica el default SCHOOL del schema.
      data: { name: name.trim(), emailDomain: emailDomain.toLowerCase(), ...(type ? { type } : {}) },
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

    // El correo del bibliotecario debe pertenecer al dominio del plantel,
    // porque el login busca el tenant a partir del dominio del email.
    const emailDomain = data.email.toLowerCase().split('@')[1];
    if (emailDomain !== tenant.emailDomain.toLowerCase()) {
      return res.status(400).json({ error: `El correo debe pertenecer al dominio ${tenant.emailDomain}` });
    }

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

const getLibrariansForTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const librarians = await prisma.user.findMany({
      where: { tenantId, role: 'librarian', isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json({ success: true, data: librarians });
  } catch (err) {
    console.error('getLibrariansForTenant error', err);
    res.status(500).json({ error: 'Failed to fetch librarians' });
  }
};

const deleteLibrarianFromTenant = async (req, res) => {
  try {
    const { tenantId, userId } = req.params;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    // Debe existir, pertenecer a ese tenant, y ser bibliotecario —
    // esta ruta no debe poder borrar alumnos ni otros roles por accidente.
    if (!existing || existing.tenantId !== tenantId || existing.role !== 'librarian') {
      return res.status(404).json({ error: 'Bibliotecario no encontrado' });
    }

    const deleted = await prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });

    console.log(`[AUDIT] superadmin ${req.user.id} eliminó bibliotecario ${userId} del tenant ${tenantId}`);
    const { password, ...userWithoutPassword } = deleted;
    res.json({ success: true, data: userWithoutPassword });
  } catch (err) {
    console.error('deleteLibrarianFromTenant error', err);
    res.status(500).json({ error: 'Failed to delete librarian' });
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

const getSettings = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    res.json({ success: true, data: { finePerDay: tenant.finePerDay } });
  } catch (err) {
    console.error('getSettings error', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const { finePerDay } = req.body;
    if (finePerDay === undefined || typeof finePerDay !== 'number' || finePerDay < 0) {
      return res.status(400).json({ error: 'Invalid finePerDay' });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { finePerDay }
    });

    res.json({ success: true, data: { finePerDay: updated.finePerDay } });
  } catch (err) {
    console.error('updateSettings error', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = { getTenants, createTenant, deleteTenant, createLibrarianForTenant, getLibrariansForTenant, deleteLibrarianFromTenant, updateTenantStatus, getSettings, updateSettings };
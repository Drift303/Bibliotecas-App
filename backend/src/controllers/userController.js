const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const { createUserSchema, updateUserSchema } = require('../validators/userValidators');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const getUsers = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const { role, q } = req.query;
    const where = { tenantId, isDeleted: false };
    if (role) where.role = role;
    if (q) where.OR = [ { name: { contains: q, mode: 'insensitive' } }, { studentId: { contains: q, mode: 'insensitive' } } ];

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('getUsers error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const data = parsed.data;

    // Role-based requirement: admin roles must have password
    const adminRoles = ['admin_plantel', 'superadmin'];
    if (adminRoles.includes(data.role) && !data.password) return res.status(400).json({ error: 'Password required for admin roles' });

    // Check uniqueness within tenant
    const existingStudentId = await prisma.user.findFirst({ where: { tenantId, studentId: data.studentId } });
    if (existingStudentId) return res.status(400).json({ error: 'studentId already exists in tenant' });
    const existingBarcode = await prisma.user.findFirst({ where: { tenantId, barcode: data.barcode } });
    if (existingBarcode) return res.status(400).json({ error: 'barcode already exists in tenant' });

    const payload = {
      tenantId,
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      role: data.role,
      studentId: data.studentId.trim(),
      department: data.department.trim(),
      barcode: data.barcode.trim(),
    };

    if (data.password) payload.password = await hashPassword(data.password);

    const created = await prisma.user.create({ data: payload });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('createUser error', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing || existing.tenantId !== tenantId) return res.status(404).json({ error: 'User not found' });

    const data = parsed.data;
    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.role) updateData.role = data.role;
    if (data.studentId) {
      // check collision
      const other = await prisma.user.findFirst({ where: { tenantId, studentId: data.studentId, NOT: { id: userId } } });
      if (other) return res.status(400).json({ error: 'studentId already exists in tenant' });
      updateData.studentId = data.studentId.trim();
    }
    if (data.department) updateData.department = data.department.trim();
    if (data.barcode) {
      const other = await prisma.user.findFirst({ where: { tenantId, barcode: data.barcode, NOT: { id: userId } } });
      if (other) return res.status(400).json({ error: 'barcode already exists in tenant' });
      updateData.barcode = data.barcode.trim();
    }
    if (data.password) updateData.password = await hashPassword(data.password);

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateUser error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing || existing.tenantId !== tenantId) return res.status(404).json({ error: 'User not found' });

    // Logical delete
    const deleted = await prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('deleteUser error', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };

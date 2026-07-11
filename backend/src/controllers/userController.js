const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createUserSchema, updateUserSchema } = require('../validators/userValidators');
const { sendTempPasswordEmail } = require('../services/emailService');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Genera una contraseña temporal legible, ej: "Bb3kPq9x"
// Evita caracteres ambiguos (0/O, 1/l/I) para que sea fácil de transcribir a mano.
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
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

    // Si el bibliotecario no especificó contraseña, se genera una temporal automáticamente.
    // Se devuelve en texto plano SOLO en esta respuesta, una única vez.
    let tempPassword = null;
    if (data.password) {
      payload.password = await hashPassword(data.password);
    } else {
      tempPassword = generateTempPassword();
      payload.password = await hashPassword(tempPassword);
    }

    const created = await prisma.user.create({ data: payload });

    // No regresar el hash de la contraseña en la respuesta
    const { password, ...userWithoutPassword } = created;

    const responseData = { ...userWithoutPassword };
    if (tempPassword) {
      responseData.tempPassword = tempPassword;

      // Enviar correo con credenciales al nuevo usuario via Resend.
      // No bloqueamos la respuesta si falla el correo — el usuario se crea igual
      // y la contraseña sigue mostrándose en pantalla como respaldo.
      sendTempPasswordEmail({
        name: created.name,
        email: created.email,
        tempPassword,
        credentialImage: data.credentialImage,
      }).then(result => {
        if (!result.success) {
          console.warn('No se pudo enviar correo de bienvenida:', result.error);
        } else {
          console.log('Correo de bienvenida enviado a:', created.email);
        }
      });
    }

    res.status(201).json({ success: true, data: responseData });
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
    const { password, ...userWithoutPassword } = updated;
    res.json({ success: true, data: userWithoutPassword });
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
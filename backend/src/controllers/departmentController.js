const prisma = require('../config/prismaClient');

const getDepartments = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const departments = await prisma.department.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: departments });
  } catch (err) {
    console.error('getDepartments error', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const existing = await prisma.department.findFirst({
      where: { tenantId, name: name.trim() }
    });
    if (existing) return res.status(400).json({ error: 'Department already exists' });

    const department = await prisma.department.create({
      data: {
        tenantId,
        name: name.trim()
      }
    });

    res.status(201).json({ success: true, data: department });
  } catch (err) {
    console.error('createDepartment error', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const duplicate = await prisma.department.findFirst({
      where: { tenantId, name: name.trim(), NOT: { id } }
    });
    if (duplicate) return res.status(400).json({ error: 'Department already exists' });

    const department = await prisma.department.update({
      where: { id },
      data: { name: name.trim() }
    });

    res.json({ success: true, data: department });
  } catch (err) {
    console.error('updateDepartment error', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const { id } = req.params;
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await prisma.department.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error('deleteDepartment error', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};

const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['student', 'librarian', 'admin_plantel', 'superadmin']),
  studentId: z.string().min(1),
  department: z.string().min(1),
  barcode: z.string().min(1),
  password: z.string().min(6).optional(),
  credentialImage: z.string().optional(),
  qrCode: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['student', 'librarian', 'admin_plantel', 'superadmin']).optional(),
  studentId: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  qrCode: z.string().optional(),
});

module.exports = { createUserSchema, updateUserSchema };

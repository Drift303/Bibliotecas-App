const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['student', 'librarian', 'admin_plantel', 'superadmin']),
  studentId: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  credentialImage: z.string().optional(),
  qrCode: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
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
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

module.exports = { createUserSchema, updateUserSchema };

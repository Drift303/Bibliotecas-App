const { z } = require('zod');

// Dominios tipo "escuela.edu.mx" — evita strings sin sentido como emailDomain
const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

const createTenantSchema = z.object({
  name: z.string().min(1),
  emailDomain: z.string().regex(domainRegex, 'Formato de dominio inválido'),
  type: z.enum(['SCHOOL', 'PUBLIC_LIBRARY']).optional(),
});

const createLibrarianSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(), // si no viene, se genera tempPassword
});

const updateTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

module.exports = { createTenantSchema, createLibrarianSchema, updateTenantStatusSchema };
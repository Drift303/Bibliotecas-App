const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(2), // email or cct
  password: z.string().min(6),
});

module.exports = { loginSchema };

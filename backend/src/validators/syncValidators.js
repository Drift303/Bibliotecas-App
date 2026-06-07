const { z } = require('zod');

const loanItemSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  loanDate: z.string().optional(),
  returnDate: z.string().optional(),
  status: z.enum(['BORROWED', 'RETURNED']).optional(),
});

const syncLoansSchema = z.object({
  tenantId: z.string().uuid(),
  transactions: z.array(loanItemSchema).min(1),
});

module.exports = { syncLoansSchema };

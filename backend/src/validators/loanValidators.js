const { z } = require('zod');

const createLoanSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  dueDate: z.string().optional(),
});

const returnLoanSchema = z.object({
  loanId: z.string().uuid(),
});

module.exports = { createLoanSchema, returnLoanSchema };

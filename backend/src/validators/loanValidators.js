const { z } = require('zod');

const createLoanSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  dueDate: z.string().optional(),
});

const returnLoanSchema = z.object({
  loanId: z.string().uuid(),
  // Estado físico del libro al momento de la devolución, capturado por el bibliotecario.
  // Viene del frontend en español ("Excelente", "Bueno", "Dañado", "Perdido"); es opcional
  // para no romper compatibilidad con clientes que no lo envíen.
  condition: z.enum(['Excelente', 'Bueno', 'Dañado', 'Perdido']).optional(),
  // Monto capturado por el bibliotecario al reportar el libro como perdido.
  replacementCost: z.number().positive().optional(),
});

module.exports = { createLoanSchema, returnLoanSchema };
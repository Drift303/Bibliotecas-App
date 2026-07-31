const { z } = require('zod');

const createLoanSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  dueDate: z.string().optional(),
  // Tipo de préstamo: a domicilio o consulta en sala. No afecta el cálculo
  // de multa ni fecha de vencimiento, es solo para reportes.
  loanType: z.enum(['HOME', 'IN_LIBRARY']).optional(),
  // Departamento/carrera seleccionado por el bibliotecario al momento del
  // préstamo (solo aplica a escuelas; en biblioteca pública no se envía).
  departmentId: z.string().uuid().optional(),
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
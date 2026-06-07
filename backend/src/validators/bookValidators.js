const { z } = require('zod');

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  locationHall: z.string().min(1),
  locationShelf: z.string().min(1),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  statusPhysical: z.enum(['GOOD', 'DAMAGED', 'LOST']).optional(),
});

module.exports = { createBookSchema };

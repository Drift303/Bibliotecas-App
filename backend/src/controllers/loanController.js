const prisma = require('../config/prismaClient');
const { createLoanSchema, returnLoanSchema } = require('../validators/loanValidators');

const FINE_PER_DAY = 5.0; // MXN

// Traduce el estado físico capturado por el bibliotecario (en español, desde el
// modal de devolución) al enum real de Prisma para Book.statusPhysical.
const CONDITION_TO_STATUS_PHYSICAL = {
  Excelente: 'GOOD',
  Bueno: 'GOOD',
  Dañado: 'DAMAGED',
};

const getLoans = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    // Filtro opcional por estado: /api/loans?status=ACTIVE o ?status=RETURNED
   const { status } = req.query;
const where = { tenantId };
if (req.user.role === 'student') {
  where.userId = req.user.id;
}
if (status === 'ACTIVE' || status === 'RETURNED') {
  where.status = status;
}

    const loans = await prisma.loan.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, studentId: true } },
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: loans });
  } catch (err) {
    console.error('getLoans error', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

const createLoan = async (req, res) => {
  try {
    const parsed = createLoanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });
    const { userId, bookId, dueDate } = parsed.data;
    const [user, book] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.book.findUnique({ where: { id: bookId } }),
    ]);
    if (!user || user.tenantId !== tenantId) return res.status(400).json({ error: 'User not found in tenant' });
    if (!book || book.tenantId !== tenantId) return res.status(400).json({ error: 'Book not found in tenant' });
    if (book.statusLogical === 'DELETED_LOGICAL') return res.status(400).json({ error: 'Book is deleted' });
    if (!book.available) return res.status(400).json({ error: 'Book not available' });
    const loanData = {
      tenantId,
      userId,
      bookId,
      status: 'ACTIVE',
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };
    const [createdLoan, updatedBook] = await prisma.$transaction([
      prisma.loan.create({
        data: loanData,
        include: {
          user: { select: { id: true, name: true, email: true, studentId: true } },
          book: { select: { id: true, title: true, author: true, isbn: true } },
        },
      }),
      prisma.book.update({ where: { id: bookId }, data: { statusLogical: 'BORROWED', available: false } }),
    ]);
    res.status(201).json({ success: true, data: createdLoan });
  } catch (err) {
    console.error('createLoan error', err);
    res.status(500).json({ error: 'Failed to create loan' });
  }
};

const returnLoan = async (req, res) => {
  try {
    const loanId = req.params.id;
    const parsed = returnLoanSchema.safeParse({ loanId, condition: req.body?.condition });
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });
    const { condition } = parsed.data;

    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });
    const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { book: true } });
    if (!loan || loan.tenantId !== tenantId) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status === 'RETURNED') return res.status(400).json({ error: 'Loan already returned' });
    const now = new Date();
    let fineAmount = 0;
    if (loan.dueDate && now > loan.dueDate) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const diff = Math.ceil((now - loan.dueDate) / msPerDay);
      fineAmount = diff * FINE_PER_DAY;
    }

    // Si el bibliotecario capturó el estado físico del libro al devolverlo,
    // se actualiza statusPhysical. Si no se envía, el libro conserva su estado anterior.
    const bookUpdateData = { available: true, statusLogical: 'ACTIVE' };
    if (condition && CONDITION_TO_STATUS_PHYSICAL[condition]) {
      bookUpdateData.statusPhysical = CONDITION_TO_STATUS_PHYSICAL[condition];
    }

    const [updatedLoan, updatedBook] = await prisma.$transaction([
      prisma.loan.update({ where: { id: loanId }, data: { returnDate: now, status: 'RETURNED', fineAmount } }),
      prisma.book.update({ where: { id: loan.bookId }, data: bookUpdateData }),
    ]);
    res.json({ success: true, data: { loan: updatedLoan, book: updatedBook } });
  } catch (err) {
    console.error('returnLoan error', err);
    res.status(500).json({ error: 'Failed to process return' });
  }
};

module.exports = { getLoans, createLoan, returnLoan };
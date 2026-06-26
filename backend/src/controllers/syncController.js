const prisma = require('../config/prismaClient');
const { syncLoansSchema } = require('../validators/syncValidators');

const syncLoans = async (req, res) => {
  try {
    const parsed = syncLoansSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { tenantId, transactions } = parsed.data;

    // Enforce that the token's tenantId matches the payload tenantId
    if (req.tenantId !== tenantId) return res.status(403).json({ error: 'Tenant mismatch' });

    // Build transactional operations
    const ops = [];
    for (const t of transactions) {
      const loanCreate = prisma.loan.create({ data: {
        tenantId,
        userId: t.userId,
        bookId: t.bookId,
        loanDate: t.loanDate ? new Date(t.loanDate) : undefined,
        returnDate: t.returnDate ? new Date(t.returnDate) : undefined,
        status: t.status || 'BORROWED',
      }});

      // update book availability when borrowed/returned
      const bookUpdate = prisma.book.updateMany({ where: { id: t.bookId, tenantId }, data: { available: t.status === 'RETURNED' ? true : false } });

      ops.push(loanCreate, bookUpdate);
    }

    await prisma.$transaction(ops);

    res.json({ success: true, processed: transactions.length });
  } catch (err) {
    console.error('syncLoans error', err);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
};

module.exports = { syncLoans };

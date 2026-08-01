const prisma = require('../config/prismaClient');
const { syncLoansSchema } = require('../validators/syncValidators');

const FINE_PER_DAY = 5.0;

const syncLoans = async (req, res) => {
  try {
    const parsed = syncLoansSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { tenantId, transactions } = parsed.data;
    if (req.tenantId !== tenantId) return res.status(403).json({ error: 'Tenant mismatch' });

    const results = [];

    await prisma.$transaction(async (tx) => {
      for (const item of transactions) {
        const status = item.status === 'RETURNED' ? 'RETURNED' : 'ACTIVE';

        if (status === 'RETURNED') {
          const loan = await findLoanForReturn(tx, tenantId, item);
          if (!loan) {
            results.push({ status: 'skipped', reason: 'loan_not_found', bookId: item.bookId, userId: item.userId });
            continue;
          }

          const returnDate = item.returnDate ? new Date(item.returnDate) : new Date();
          const fineAmount = calculateFine(loan.dueDate, returnDate);

          await tx.loan.update({
            where: { id: loan.id },
            data: { returnDate, status: 'RETURNED', fineAmount },
          });
          await tx.book.updateMany({
            where: { id: loan.bookId, tenantId },
            data: { available: true, statusLogical: 'ACTIVE' },
          });

          results.push({ status: 'returned', loanId: loan.id });
          continue;
        }

        const existingActiveLoan = await tx.loan.findFirst({
          where: {
            tenantId,
            userId: item.userId,
            bookId: item.bookId,
            status: 'ACTIVE',
          },
        });

        if (existingActiveLoan) {
          results.push({ status: 'skipped', reason: 'active_loan_exists', loanId: existingActiveLoan.id });
          continue;
        }

        const createdLoan = await tx.loan.create({
          data: {
            tenantId,
            userId: item.userId,
            bookId: item.bookId,
            loanDate: item.loanDate ? new Date(item.loanDate) : undefined,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
            status: 'ACTIVE',
          },
        });

        await tx.book.updateMany({
          where: { id: item.bookId, tenantId },
          data: { available: false, statusLogical: 'BORROWED' },
        });

        results.push({ status: 'created', loanId: createdLoan.id });
      }
    });

    res.json({ success: true, processed: transactions.length, results });
  } catch (err) {
    console.error('syncLoans error', err);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
};

async function findLoanForReturn(tx, tenantId, item) {
  if (item.loanId) {
    const byId = await tx.loan.findFirst({
      where: { id: item.loanId, tenantId },
    });
    if (byId) return byId;
  }

  return tx.loan.findFirst({
    where: {
      tenantId,
      userId: item.userId,
      bookId: item.bookId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });
}

function calculateFine(dueDate, returnDate) {
  if (!dueDate || returnDate <= dueDate) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((returnDate - dueDate) / msPerDay) * FINE_PER_DAY;
}

module.exports = { syncLoans };

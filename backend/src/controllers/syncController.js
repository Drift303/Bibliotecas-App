const prisma = require('../config/prismaClient');
const { syncLoansSchema } = require('../validators/syncValidators');

const FINE_PER_DAY_FALLBACK = 5.0; // MXN — solo se usa si el tenant no tiene finePerDay configurado

// Mismo offset y misma lógica que loanController.js — México central (UTC-6).
const MX_UTC_OFFSET_HOURS = 6;

// Convierte una fecha tipo "AAAA-MM-DD" (como la que manda el <input type="date">
// del formulario offline) a medianoche real de México, como instante UTC.
// Sin esto, new Date("2026-08-09") se interpreta como medianoche UTC — 6 horas
// antes de la medianoche real en México — y el préstamo queda marcado "Vencido"
// horas antes de que en realidad lo esté.
const toMxMidnight = (dateInput) => {
  if (!dateInput) return undefined;
  const d = new Date(dateInput);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(utcMidnight + MX_UTC_OFFSET_HOURS * 60 * 60 * 1000);
};

const syncLoans = async (req, res) => {
  try {
    const parsed = syncLoansSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });

    const { tenantId, transactions } = parsed.data;
    if (req.tenantId !== tenantId) return res.status(403).json({ error: 'Tenant mismatch' });

    // Igual que en loanController.js: la multa por día usa lo que el plantel
    // configuró, no un valor fijo — si no tiene nada configurado, usa el fallback.
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const finePerDay = tenant.finePerDay ?? FINE_PER_DAY_FALLBACK;

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
          const fineAmount = calculateFine(loan.dueDate, returnDate, finePerDay);

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
            dueDate: toMxMidnight(item.dueDate),
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

function calculateFine(dueDate, returnDate, finePerDay) {
  if (!dueDate || returnDate <= dueDate) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((returnDate - dueDate) / msPerDay) * finePerDay;
}

module.exports = { syncLoans };

const prisma = require('../config/prismaClient');

// Devuelve [inicioMes, finMes) en UTC a partir de un string "YYYY-MM".
// Si no se manda month, usa el mes actual.
const getMonthRange = (monthParam) => {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-indexed

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    year = y;
    month = m - 1;
  }

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start, end };
};

// GET /api/reports/loans?month=2026-03
// Genera la data agregada para el reporte mensual de préstamos: resumen por
// departamento, cruce por género, y top 10 de libros más prestados (separado
// por tipo de préstamo). El frontend arma el Excel con esta data (misma
// librería xlsx que ya usa AnnualCheck.tsx), este endpoint solo agrega.
const getLoansReport = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { start, end } = getMonthRange(req.query.month);

    const loans = await prisma.loan.findMany({
      where: {
        tenantId,
        loanDate: { gte: start, lt: end },
      },
      include: {
        user: { select: { id: true, name: true, gender: true } },
        book: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // --- Resumen por departamento (o total simple si es biblioteca pública) ---
    const summaryMap = new Map(); // key: nombre de departamento (o "Total" si no aplica)
    const genderMap = new Map(); // key: `${departamento}||${genero}`
    const bookCountHome = new Map(); // key: bookId -> { title, count }
    const bookCountInLibrary = new Map();

    for (const loan of loans) {
      const deptName = tenant.type === 'SCHOOL'
        ? (loan.department ? loan.department.name : 'Sin departamento')
        : 'Total';

      const isHome = loan.loanType !== 'IN_LIBRARY';

      // Resumen
      const summary = summaryMap.get(deptName) || { departamento: deptName, prestamos: 0, prestamoEnSala: 0, total: 0 };
      if (isHome) summary.prestamos += 1; else summary.prestamoEnSala += 1;
      summary.total += 1;
      summaryMap.set(deptName, summary);

      // Por género
      const genderLabel = loan.user.gender === 'MALE' ? 'Hombres' : loan.user.gender === 'FEMALE' ? 'Mujeres' : 'Otro/Sin especificar';
      const genderKey = `${deptName}||${genderLabel}`;
      const genderRow = genderMap.get(genderKey) || { departamento: deptName, genero: genderLabel, total: 0 };
      genderRow.total += 1;
      genderMap.set(genderKey, genderRow);

      // Libros más prestados, separado por tipo
      const targetMap = isHome ? bookCountHome : bookCountInLibrary;
      const bookRow = targetMap.get(loan.bookId) || { titulo: loan.book.title, veces: 0 };
      bookRow.veces += 1;
      targetMap.set(loan.bookId, bookRow);
    }

    const topBooks = (map) =>
      Array.from(map.values())
        .sort((a, b) => b.veces - a.veces)
        .slice(0, 10);

    res.json({
      success: true,
      data: {
        tenantType: tenant.type,
        month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
        summary: Array.from(summaryMap.values()),
        byGender: Array.from(genderMap.values()),
        topBooksHome: topBooks(bookCountHome),
        topBooksInLibrary: topBooks(bookCountInLibrary),
        totalLoans: loans.length,
      },
    });
  } catch (err) {
    console.error('getLoansReport error', err);
    res.status(500).json({ error: 'Failed to generate loans report' });
  }
};

module.exports = { getLoansReport };

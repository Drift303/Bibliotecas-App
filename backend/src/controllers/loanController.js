const prisma = require('../config/prismaClient');
const { createLoanSchema, returnLoanSchema } = require('../validators/loanValidators');
const { sendLoanDueReminderEmail } = require('../services/emailService');

const FINE_PER_DAY_FALLBACK = 5.0; // MXN — solo se usa si el tenant no tiene finePerDay configurado

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
} else if (status === 'OVERDUE') {
  where.status = 'ACTIVE';
  where.dueDate = { lt: getMxTodayStart() };
}

    const loans = await prisma.loan.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, studentId: true } },
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // isOverdue se calcula aquí (con el mismo criterio de día calendario de
    // México que el resto del módulo) para que el frontend no tenga que
    // recalcularlo comparando contra la hora local del navegador de quien
    // esté viendo la pantalla, que puede no coincidir y desfasar el estado.
    const data = loans.map((loan) => ({
      ...loan,
      isOverdue: loan.status === 'ACTIVE' && isPastDueDay(loan.dueDate),
    }));

    res.json({ success: true, data });
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
    const { userId, bookId, dueDate, loanType, departmentId } = parsed.data;
    const [user, book] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.book.findUnique({ where: { id: bookId } }),
    ]);
    if (!user || user.tenantId !== tenantId) return res.status(400).json({ error: 'User not found in tenant' });
    if (!book || book.tenantId !== tenantId) return res.status(400).json({ error: 'Book not found in tenant' });
    if (book.statusLogical === 'DELETED_LOGICAL') return res.status(400).json({ error: 'Book is deleted' });
    if (!book.available) return res.status(400).json({ error: 'Book not available' });

    // Si viene departmentId, confirmar que pertenece al mismo tenant (evita que
    // alguien mande el id de un departamento de otra escuela).
    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department || department.tenantId !== tenantId) {
        return res.status(400).json({ error: 'Department not found in tenant' });
      }
    }

    const loanData = {
      tenantId,
      userId,
      bookId,
      status: 'ACTIVE',
     dueDate: dueDate ? toMxMidnight(dueDate) : undefined,
      loanType: loanType || 'HOME',
      // Se guarda tal cual lo seleccionó el bibliotecario en ese momento — es
      // una "foto" histórica, no se vuelve a leer del perfil del alumno después.
      departmentId: departmentId || undefined,
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
    const parsed = returnLoanSchema.safeParse({
      loanId,
      condition: req.body?.condition,
      replacementCost: req.body?.replacementCost,
    });
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.format() });
    const { condition, replacementCost: capturedCost } = parsed.data;

    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });
    const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { book: true } });
    if (!loan || loan.tenantId !== tenantId) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status === 'RETURNED') return res.status(400).json({ error: 'Loan already returned' });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const finePerDay = tenant?.finePerDay ?? FINE_PER_DAY_FALLBACK;
    const now = new Date();
    let fineAmount = 0;
    
    if (condition === 'Perdido') {
      // Prioridad: monto capturado por el bibliotecario al devolver > valor de referencia
      // del libro (si algún día se configura) > fallback fijo.
      fineAmount = (typeof capturedCost === 'number' && capturedCost > 0)
        ? capturedCost
        : (loan.book.replacementCost || 500.0);
    } else if (loan.dueDate && isPastDueDay(loan.dueDate)) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const diasAtraso = Math.round((getMxTodayStart().getTime() - new Date(loan.dueDate).getTime()) / msPerDay);
      fineAmount = diasAtraso * finePerDay; // usar el valor configurado por el tenant, no la constante
    }

    // Si el bibliotecario capturó el estado físico del libro al devolverlo,
    // se actualiza statusPhysical. Si no se envía, el libro conserva su estado anterior.
    const bookUpdateData = { available: true, statusLogical: 'ACTIVE' };
    
    if (condition === 'Perdido') {
      bookUpdateData.available = false;
      bookUpdateData.statusPhysical = 'LOST';
      // Guardamos el monto capturado como referencia para la próxima vez que se
      // pierda un ejemplar de este libro (no obliga a usarlo, solo es punto de partida).
      if (typeof capturedCost === 'number' && capturedCost > 0) {
        bookUpdateData.replacementCost = capturedCost;
      }
    } else if (condition && CONDITION_TO_STATUS_PHYSICAL[condition]) {
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

// Offset fijo de México central (UTC-6). México dejó de usar horario de
// verano en la mayor parte del país desde 2022. Si el sistema llega a dar
// servicio a planteles en otro huso horario del país (p. ej. Baja
// California, UTC-8/-7), este valor tendría que volverse configurable por
// tenant en vez de una constante global.
const MX_UTC_OFFSET_HOURS = 6;

// Rango [inicio, fin) del día de "hoy" en calendario de México, usado para
// "vencen hoy". dueDate siempre se guarda como medianoche UTC del día
// elegido (ver createLoan), sin importar en qué huso horario corra el
// servidor. Por eso "hoy" se calcula aquí también en términos de ese mismo
// día calendario (en vez de usar la hora local del proceso de Node, que
// puede no coincidir con la de los usuarios y desfasar la comparación).
const getMxTodayStart = () => {
  const nowUtc = new Date();
  const mxNow = new Date(nowUtc.getTime() - MX_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const mxMidnightUtc = Date.UTC(mxNow.getUTCFullYear(), mxNow.getUTCMonth(), mxNow.getUTCDate());
  return new Date(mxMidnightUtc + MX_UTC_OFFSET_HOURS * 60 * 60 * 1000);
};

const getTodayRange = () => {
  const start = getMxTodayStart();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

// Un préstamo solo se considera vencido cuando ya pasó COMPLETO el día
// calendario (México) en que vencía. El día mismo del vencimiento no cuenta
// como vencido: el lector todavía tiene todo ese día para devolver el libro
// sin multa.
const isPastDueDay = (dueDate) => {
  if (!dueDate) return false;
  return getMxTodayStart().getTime() > new Date(dueDate).getTime();
};

// Convierte "AAAA-MM-DD" (de un <input type="date">) a medianoche real de
// México, como instante UTC — evita que new Date("2026-08-09") se lea como
// medianoche UTC, que son 6 horas antes de la medianoche real en México.
const toMxMidnight = (dateInput) => {
  const d = new Date(dateInput);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(utcMidnight + MX_UTC_OFFSET_HOURS * 60 * 60 * 1000);
};


// Determina el correo utilizable para notificar a un lector, según tipo de tenant.
// Escuela: siempre el correo institucional (user.email). Biblioteca pública: solo
// contactEmail cuenta como correo real; user.email ahí es un correo ficticio de login.
const getUsableContactEmail = (tenantType, user) =>
  tenantType === 'PUBLIC_LIBRARY' ? (user.contactEmail || null) : user.email;

const getLoansDueToday = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { start, end } = getTodayRange();

    const loans = await prisma.loan.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        dueDate: { gte: start, lt: end },
      },
      include: {
        user: { select: { id: true, name: true, email: true, contactEmail: true, contactPhone: true } },
        book: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const data = loans.map((loan) => {
      const contactEmail = getUsableContactEmail(tenant.type, loan.user);
      const alreadyNotifiedToday =
        !!loan.lastReminderSentAt && loan.lastReminderSentAt >= start && loan.lastReminderSentAt < end;
      return {
        id: loan.id,
        studentName: loan.user.name,
        bookTitle: loan.book.title,
        tenantType: tenant.type,
        contactEmail,
        contactPhone: loan.user.contactPhone || null,
        hasUsableEmail: !!contactEmail,
        alreadyNotifiedToday,
        lastReminderSentAt: loan.lastReminderSentAt,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('getLoansDueToday error', err);
    res.status(500).json({ error: 'Failed to fetch loans due today' });
  }
};

const remindAllDueToday = async (req, res) => {
  try {
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const { start, end } = getTodayRange();

    const loans = await prisma.loan.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        dueDate: { gte: start, lt: end },
      },
      include: {
        user: true,
        book: { select: { id: true, title: true } },
      },
    });

    let sent = 0;
    let skipped = 0;
    const skippedDetails = [];

    for (const loan of loans) {
      const contactEmail = getUsableContactEmail(tenant.type, loan.user);
      if (!contactEmail) {
        // Caso 3: solo tiene teléfono de contacto, nunca se manda automático.
        skipped += 1;
        skippedDetails.push({ loanId: loan.id, studentName: loan.user.name, contactPhone: loan.user.contactPhone || null });
        continue;
      }
      try {
        await sendLoanDueReminderEmail({
          name: loan.user.name,
          email: contactEmail,
          bookTitle: loan.book.title,
          dueDate: loan.dueDate,
        });
        await prisma.loan.update({ where: { id: loan.id }, data: { lastReminderSentAt: new Date() } });
        sent += 1;
      } catch (sendErr) {
        console.error(`remindAllDueToday: fallo al enviar a loan ${loan.id}`, sendErr);
        skipped += 1;
        skippedDetails.push({ loanId: loan.id, studentName: loan.user.name, contactPhone: loan.user.contactPhone || null });
      }
    }

    res.json({ success: true, data: { sent, skipped, skippedDetails } });
  } catch (err) {
    console.error('remindAllDueToday error', err);
    res.status(500).json({ error: 'Failed to send bulk reminders' });
  }
};

const sendReminder = async (req, res) => {
  try {
    const loanId = req.params.id;
    const tenantId = req.user && req.user.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Missing tenant context' });

    const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { user: true, book: true } });
    if (!loan || loan.tenantId !== tenantId) return res.status(404).json({ error: 'Loan not found' });
    
    if (loan.status !== 'ACTIVE') return res.status(400).json({ error: 'Loan is not active' });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    // Escuela: siempre correo institucional real. Biblioteca pública: correo de contacto real
    // (loan.user.email en biblioteca pública es un correo ficticio de login, nunca llega de verdad).
    const recipientEmail = tenant.type === 'PUBLIC_LIBRARY' ? loan.user.contactEmail : loan.user.email;

    if (!recipientEmail) {
      // Biblioteca pública sin contactEmail (solo tiene contactPhone) — no se puede mandar correo
      return res.status(400).json({
        error: 'NO_EMAIL_CONTACT',
        contactPhone: loan.user.contactPhone || null,
      });
    }

    // Enviar correo de recordatorio (simulado o real si está integrado en emailService)
    console.log(`[REMINDER] Recordatorio enviado a ${recipientEmail} por el libro ${loan.book.title}`);
    
    await sendLoanDueReminderEmail({
      name: loan.user.name,
      email: recipientEmail,
      bookTitle: loan.book.title,
      dueDate: loan.dueDate
    });

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: { lastReminderSentAt: new Date() }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('sendReminder error', err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
};

module.exports = { getLoans, createLoan, returnLoan, sendReminder, getLoansDueToday, remindAllDueToday };
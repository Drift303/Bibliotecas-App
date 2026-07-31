const prisma = require('../config/prismaClient');
const { isValidCycle, monthlyPrice, CYCLES } = require('../config/plans');
const {
  createPaymentPreference,
  fetchPayment,
  parseExternalReference,
} = require('../services/mercadoPagoService');

// Lista el precio mensual y los ciclos disponibles con su descuento,
// para que el frontend no tenga que hardcodear montos.
const getPlanCatalog = async (req, res) => {
  res.json({ success: true, data: { monthlyPrice, cycles: CYCLES } });
};

// Superadmin genera un link de cobro (checkout) para un plantel específico.
const createCheckout = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { cycle } = req.body;

    if (!isValidCycle(cycle)) {
      return res.status(400).json({ error: 'Ciclo de facturación inválido' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const preference = await createPaymentPreference({
      tenantId: tenant.id,
      tenantName: tenant.name,
      cycle,
    });

    console.log(`[AUDIT] superadmin ${req.user.id} generó cobro para tenant ${tenantId}: ${cycle}`);
    res.status(201).json({ success: true, data: preference });
  } catch (err) {
    console.error('createCheckout error', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout' });
  }
};

// Calcula la nueva fecha de vencimiento del plan: extiende desde la
// fecha actual de vencimiento si el plan sigue vigente, o desde hoy si ya venció.
const extendExpiration = (currentExpiresAt, months) => {
  const base = currentExpiresAt && new Date(currentExpiresAt) > new Date()
    ? new Date(currentExpiresAt)
    : new Date();
  base.setMonth(base.getMonth() + months);
  return base;
};

// Webhook de Mercado Pago. No confiamos en el body: siempre se
// vuelve a consultar el pago real contra la API antes de activar nada.
const mercadoPagoWebhook = async (req, res) => {
  try {
    const paymentId = req.query['data.id'] || req.body?.data?.id || req.query.id;
    const topic = req.query.type || req.query.topic || req.body?.type;

    // Solo nos interesan notificaciones de pago; otros topics se ignoran sin error.
    if (topic && topic !== 'payment') {
      return res.status(200).json({ received: true });
    }
    if (!paymentId) return res.status(400).json({ error: 'Missing payment id' });

    const payment = await fetchPayment(paymentId);
    if (payment.status !== 'approved') {
      // Pendiente, rechazado, etc. — no activamos el plan, pero respondemos 200
      // para que Mercado Pago no siga reintentando.
      return res.status(200).json({ received: true, status: payment.status });
    }

    const { tenantId, cycle } = parseExternalReference(payment.external_reference);
    if (!tenantId || !isValidCycle(cycle)) {
      console.warn('Webhook con external_reference inválido:', payment.external_reference);
      return res.status(200).json({ received: true });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(200).json({ received: true });

    // Idempotencia: si ya procesamos este pago antes, no lo aplicamos dos veces.
    if (tenant.lastPaymentId === String(payment.id)) {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    const months = CYCLES[cycle].months;
    const newExpiresAt = extendExpiration(tenant.planExpiresAt, months);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        billingCycle: cycle,
        planExpiresAt: newExpiresAt,
        lastPaymentId: String(payment.id),
      },
    });

    console.log(`[AUDIT] pago ${payment.id} aprobado — tenant ${tenantId} activado (${cycle}) hasta ${newExpiresAt.toISOString()}`);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('mercadoPagoWebhook error', err);
    // Respondemos 200 igual para evitar reintentos infinitos de MP ante un error nuestro;
    // el error ya queda registrado en los logs para revisarlo.
    res.status(200).json({ received: true, error: true });
  }
};

module.exports = { getPlanCatalog, createCheckout, mercadoPagoWebhook };

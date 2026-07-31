const { monthlyPrice, CYCLES, calculateTotal } = require('../config/plans');

const MP_API = 'https://api.mercadopago.com';

// En sandbox usa credenciales de prueba (TEST-...), en producción credenciales reales.
// No cambia nada del código, solo la variable de entorno.
const getAccessToken = () => process.env.MERCADOPAGO_ACCESS_TOKEN;

// external_reference codifica qué tenant/ciclo está pagando,
// para poder reconstruirlo cuando llegue la notificación del webhook.
const buildExternalReference = ({ tenantId, cycle }) => `${tenantId}::${cycle}`;

const parseExternalReference = (ref) => {
  const [tenantId, cycle] = String(ref || '').split('::');
  return { tenantId, cycle };
};

// Crea una preferencia de pago (checkout) para que el plantel pague su suscripción.
const createPaymentPreference = async ({ tenantId, tenantName, cycle }) => {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');

  const total = calculateTotal(cycle);
  if (total === null) throw new Error('Ciclo de facturación inválido');

  const cycleInfo = CYCLES[cycle];
  const backendUrl = process.env.BACKEND_PUBLIC_URL; // ej. https://dynamic-charm-production-3133.up.railway.app
  const frontendUrl = process.env.FRONTEND_PUBLIC_URL; // ej. https://bibliotecas-app-production-7dc0.up.railway.app

  const body = {
    items: [
      {
        title: `Biblioteca Inteligente — Suscripción ${cycleInfo.label}`,
        quantity: 1,
        unit_price: total,
        currency_id: 'MXN',
      },
    ],
    external_reference: buildExternalReference({ tenantId, cycle }),
    notification_url: backendUrl ? `${backendUrl}/api/billing/webhook` : undefined,
    back_urls: frontendUrl
      ? {
          success: `${frontendUrl}/superadmin/billing`,
          pending: `${frontendUrl}/superadmin/billing`,
          failure: `${frontendUrl}/superadmin/billing`,
        }
      : undefined,
    metadata: { tenantId, tenantName, cycle },
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo crear la preferencia de pago');
  }

  return {
    preferenceId: data.id,
    initPoint: data.init_point, // checkout productivo
    sandboxInitPoint: data.sandbox_init_point, // checkout de pruebas
    total,
  };
};

// Nunca confiamos en el cuerpo del webhook directamente — siempre
// se vuelve a consultar el pago contra la API de Mercado Pago para
// confirmar su estado real antes de activar un plan.
const fetchPayment = async (paymentId) => {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'No se pudo consultar el pago');
  }
  return data;
};

module.exports = {
  createPaymentPreference,
  fetchPayment,
  parseExternalReference,
};

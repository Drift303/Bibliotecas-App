const express = require('express');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');
const roleGuard = require('../middlewares/roleGuard');
const { getPlanCatalog, createCheckout, mercadoPagoWebhook } = require('../controllers/billingController');

// Solo superadmin puede consultar el catálogo y generar cobros.
router.get('/plans', authGuard, roleGuard(['superadmin']), getPlanCatalog);
router.post('/:tenantId/checkout', authGuard, roleGuard(['superadmin']), createCheckout);

// Webhook: lo llama Mercado Pago desde fuera, sin sesión/JWT nuestro.
// La confirmación real de seguridad pasa por volver a consultar el pago
// contra la API de Mercado Pago dentro del controller, no por confiar en este request.
router.post('/webhook', mercadoPagoWebhook);
router.get('/webhook', mercadoPagoWebhook); // MP a veces notifica por GET también

module.exports = router;

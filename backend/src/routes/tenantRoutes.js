const express = require('express');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');
const roleGuard = require('../middlewares/roleGuard');
const saasGuard = require('../middlewares/saasGuard');
const {
  getTenants,
  createTenant,
  createLibrarianForTenant,
  updateTenantStatus,
  getSettings,
  updateSettings
} = require('../controllers/tenantController');

// Rutas exclusivas de superadmin
router.get('/', authGuard, roleGuard(['superadmin']), getTenants);
router.post('/', authGuard, roleGuard(['superadmin']), createTenant);
router.post('/:tenantId/librarian', authGuard, roleGuard(['superadmin']), createLibrarianForTenant);
router.patch('/:tenantId/status', authGuard, roleGuard(['superadmin']), updateTenantStatus);

// Rutas de configuración del tenant (Bibliotecarios y Admins)
router.get('/settings/current', authGuard, saasGuard, roleGuard(['librarian', 'admin_plantel', 'superadmin']), getSettings);
router.put('/settings/current', authGuard, saasGuard, roleGuard(['librarian', 'admin_plantel', 'superadmin']), updateSettings);

module.exports = router;
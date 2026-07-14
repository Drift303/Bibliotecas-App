const express = require('express');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');
const roleGuard = require('../middlewares/roleGuard');
const {
  getTenants,
  createTenant,
  createLibrarianForTenant,
  updateTenantStatus,
} = require('../controllers/tenantController');

// Todas estas rutas son exclusivas de superadmin.
// Nunca llevan saasGuard: el superadmin no opera "dentro" de un tenant.
router.use(authGuard, roleGuard(['superadmin']));

router.get('/', getTenants);
router.post('/', createTenant);
router.post('/:tenantId/librarian', createLibrarianForTenant);
router.patch('/:tenantId/status', updateTenantStatus);

module.exports = router;
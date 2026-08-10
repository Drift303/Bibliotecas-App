const express = require('express');
const router = express.Router();
const { getLoansReport } = require('../controllers/reportController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

// Solo personal del plantel puede generar reportes (no los lectores).
const staffRoles = ['superadmin', 'admin_plantel', 'librarian'];

router.get('/loans', authGuard, saasGuard, roleGuard(staffRoles), getLoansReport);

module.exports = router;

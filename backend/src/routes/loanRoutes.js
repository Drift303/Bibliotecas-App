const express = require('express');
const router = express.Router();
const { getLoans, createLoan, returnLoan, sendReminder, getLoansDueToday, remindAllDueToday } = require('../controllers/loanController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

// Solo personal del plantel puede gestionar préstamos (crear, devolver, recordatorios,
// ver quién vence hoy). Los lectores (role 'student') SÍ pueden ver el listado de
// préstamos vía GET / — el controlador getLoans ya filtra para que solo vean los suyos.
const staffRoles = ['superadmin', 'admin_plantel', 'librarian'];

router.get('/', authGuard, saasGuard, roleGuard([...staffRoles, 'student']), getLoans);
router.get('/due-today', authGuard, saasGuard, roleGuard(staffRoles), getLoansDueToday);
router.post('/', authGuard, saasGuard, roleGuard(staffRoles), createLoan);
router.post('/remind-all-due-today', authGuard, saasGuard, roleGuard(staffRoles), remindAllDueToday);
router.post('/:id/return', authGuard, saasGuard, roleGuard(staffRoles), returnLoan);
router.post('/:id/remind', authGuard, saasGuard, roleGuard(staffRoles), sendReminder);

module.exports = router;
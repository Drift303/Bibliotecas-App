const express = require('express');
const router = express.Router();
const { getLoans, createLoan, returnLoan, sendReminder, getLoansDueToday, remindAllDueToday } = require('../controllers/loanController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

const librarianRoles = ['librarian', 'admin_plantel', 'superadmin'];

router.get('/', authGuard, saasGuard, getLoans);
router.get('/due-today', authGuard, saasGuard, roleGuard(librarianRoles), getLoansDueToday);
router.post('/', authGuard, saasGuard, createLoan);
router.post('/remind-all-due-today', authGuard, saasGuard, roleGuard(librarianRoles), remindAllDueToday);
router.post('/:id/return', authGuard, saasGuard, returnLoan);
router.post('/:id/remind', authGuard, saasGuard, roleGuard(librarianRoles), sendReminder);

module.exports = router;
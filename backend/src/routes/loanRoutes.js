const express = require('express');
const router = express.Router();
const { getLoans, createLoan, returnLoan, sendReminder } = require('../controllers/loanController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');

router.get('/', authGuard, saasGuard, getLoans);
router.post('/', authGuard, saasGuard, createLoan);
router.post('/:id/return', authGuard, saasGuard, returnLoan);
router.post('/:id/remind', authGuard, saasGuard, sendReminder);

module.exports = router;
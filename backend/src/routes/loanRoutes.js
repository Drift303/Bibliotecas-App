const express = require('express');
const router = express.Router();
const { createLoan, returnLoan } = require('../controllers/loanController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');

router.post('/', authGuard, saasGuard, createLoan);
router.post('/:id/return', authGuard, saasGuard, returnLoan);

module.exports = router;

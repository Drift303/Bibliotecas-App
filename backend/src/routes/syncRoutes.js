const express = require('express');
const router = express.Router();
const { syncLoans } = require('../controllers/syncController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');

router.post('/loans', authGuard, saasGuard, syncLoans);

module.exports = router;

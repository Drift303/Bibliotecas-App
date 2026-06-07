const express = require('express');
const router = express.Router();
const { getBooks, createBook } = require('../controllers/bookController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');

router.get('/', authGuard, saasGuard, getBooks);
router.post('/', authGuard, saasGuard, createBook);

module.exports = router;

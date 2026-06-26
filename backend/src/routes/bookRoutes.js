const express = require('express');
const router = express.Router();

const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');

router.get('/', authGuard, saasGuard, getBooks);
router.post('/', authGuard, saasGuard, createBook);

router.put('/:id', authGuard, saasGuard, updateBook);
router.delete('/:id', authGuard, saasGuard, deleteBook);

module.exports = router;
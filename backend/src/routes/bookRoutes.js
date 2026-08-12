const express = require('express');
const router = express.Router();

const {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  createBooksBulk,
  importBooks,
  getAuditTargets,
} = require('../controllers/bookController');

const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

const bookRoles = ['librarian', 'admin_plantel', 'superadmin'];

router.get('/', authGuard, saasGuard, getBooks);
router.get('/audit-targets', authGuard, saasGuard, roleGuard(bookRoles), getAuditTargets);
router.post('/', authGuard, saasGuard, roleGuard(bookRoles), createBook);
router.post('/bulk', authGuard, saasGuard, roleGuard(bookRoles), createBooksBulk);
router.post('/import', authGuard, saasGuard, roleGuard(bookRoles), importBooks);

router.put('/:id', authGuard, saasGuard, roleGuard(bookRoles), updateBook);
router.delete('/:id', authGuard, saasGuard, roleGuard(bookRoles), deleteBook);

module.exports = router;
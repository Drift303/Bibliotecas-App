const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

// Allowed roles for user management
const allowed = ['superadmin', 'admin_plantel', 'librarian'];

router.get('/', authGuard, saasGuard, roleGuard(allowed), getUsers);
router.post('/', authGuard, saasGuard, roleGuard(allowed), createUser);
router.put('/:id', authGuard, saasGuard, roleGuard(allowed), updateUser);
router.delete('/:id', authGuard, saasGuard, roleGuard(allowed), deleteUser);

module.exports = router;

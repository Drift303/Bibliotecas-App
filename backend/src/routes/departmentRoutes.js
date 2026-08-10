const express = require('express');
const router = express.Router();

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

const authGuard = require('../middlewares/authGuard');
const saasGuard = require('../middlewares/saasGuard');
const roleGuard = require('../middlewares/roleGuard');

const librarianRoles = ['librarian', 'admin_plantel', 'superadmin'];

router.get('/', authGuard, saasGuard, getDepartments);
router.post('/', authGuard, saasGuard, roleGuard(librarianRoles), createDepartment);
router.put('/:id', authGuard, saasGuard, roleGuard(librarianRoles), updateDepartment);
router.delete('/:id', authGuard, saasGuard, roleGuard(librarianRoles), deleteDepartment);

module.exports = router;

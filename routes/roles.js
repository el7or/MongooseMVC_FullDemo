const express = require('express');

const rolesController = require('../controllers/roles');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /roles-list => GET
router.get('/roles-list', isAuth, rolesController.getAllRoles);

// /add-role => GET
router.get('/add-role', isAuth, rolesController.getAddRole);

// /add-role => POST
router.post('/add-role', isAuth, rolesController.postAddRole);

// /edit-role/1 => GET
router.get('/edit-role/:roleId', isAuth, rolesController.getEditRole);

// /edit-role => POST
router.post('/edit-role', isAuth, rolesController.postEditRole);

// /delete-role => GET
router.get('/delete-role/:roleId', isAuth, rolesController.postDeleteRole);

module.exports = router;
//exports.routes = router;

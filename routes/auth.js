const express = require('express');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');
const { isRequired } = require('../middleware/validators');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', [isRequired('name'), isRequired('password')], authController.postLogin);

router.get('/logout', isAuth, authController.postLogout);

router.get('/reset-password', authController.getReset);

router.post('/reset-password', authController.postReset);

router.get('/new-password', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
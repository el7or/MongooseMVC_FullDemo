const express = require('express');

const indexController = require('../controllers/index');

const router = express.Router();

// / => GET
router.get('/', indexController.getIndex);

// /download-help => GET
router.get('/download-help', indexController.getPdfHelp);

module.exports = router;
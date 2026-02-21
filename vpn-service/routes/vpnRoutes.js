const express = require('express');
const router = express.Router();
const vpnController = require('../controllers/vpnController');

router.get('/networks', vpnController.getAllNetworks);
router.post('/networks', vpnController.createNetwork);
router.post('/clients', vpnController.addClient);
router.get('/clients/:id/config', vpnController.getClientConfig);
router.get('/clients/user/:userId/config', vpnController.getClientConfigByUserId);

module.exports = router;

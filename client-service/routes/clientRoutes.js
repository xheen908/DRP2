const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Alle Routen sind geschützt und die Autorisierung erfolgt im Controller
router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
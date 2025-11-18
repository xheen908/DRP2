const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Alle Routen sind geschützt und die Autorisierung erfolgt im Controller
router.get('/', clientController.getAllClients);
router.post('/', clientController.createClient);
router.get('/clients-for-dropdown', clientController.getClientsForDropdown); // NEU: Spezifische Route für Dropdown-Clients
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
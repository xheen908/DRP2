const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware zur internen Authentifizierung (optional, falls Service-zu-Service-Auth gewünscht)
// const { authenticateService } = require('../middleware/serviceAuthMiddleware');

// Öffentliche Routen (keine Authentifizierung erforderlich)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout); // Logout setzt kein Auth-Header voraus, nur Cookie löschen

// Interne Route zur Token-Validierung (vom API Gateway aufgerufen, keine Auth vorausgesetzt)
router.post('/validate-token', authController.validateToken);

// Geschützte Routen zur Benutzer- und Rollenverwaltung (erfordern X-User-Roles Header vom Gateway)
// Die Autorisierung erfolgt im Controller basierend auf diesen Headern.
router.get('/users', authController.getAllUsers);
router.post('/users', authController.register); // Registrierung ist auch ein POST für neue User
router.get('/users/:id', authController.getUserById);
router.put('/users/:id', authController.updateUser);
router.put('/users/:id/password', authController.updateUserPassword);
router.delete('/users/:id', authController.deleteUser);

router.get('/roles', authController.getAllRoles);

// Zusätzliche Routen für Zuweisungen in anderen Services
router.get('/users-for-assignment', authController.getUsersForAssignment);


module.exports = router;
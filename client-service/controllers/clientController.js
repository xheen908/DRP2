const Client = require('../models/clientModel');
const { Op } = require('sequelize');

// Hilfsfunktion zur Autorisierung basierend auf X-User-Roles Header
const authorize = (req, res, next, requiredRoles) => {
    const userRolesHeader = req.headers['x-user-roles'];
    if (!userRolesHeader) {
        return res.status(403).json({ message: 'Autorisierungsinformationen fehlen.' });
    }
    const userRoles = userRolesHeader.split(',');
    const hasPermission = userRoles.some(role => requiredRoles.includes(role));
    if (hasPermission) {
        next();
    } else {
        res.status(403).json({ message: 'Keine ausreichenden Berechtigungen für diese Aktion.' });
    }
};

// Alle Clients abrufen
exports.getAllClients = async (req, res) => {
    // Autorisierung: Nur Manager, Admin, Disponent dürfen Clients sehen
    authorize(req, res, async () => {
        try {
            const clients = await Client.findAll();
            res.status(200).json(clients);
        } catch (error) {
            console.error('Fehler beim Abrufen aller Clients:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};

// Client nach ID abrufen
exports.getClientById = async (req, res) => {
    // Autorisierung: Nur Manager, Admin, Disponent dürfen Clients sehen
    authorize(req, res, async () => {
        const { id } = req.params;
        try {
            const client = await Client.findByPk(id);
            if (!client) {
                return res.status(404).json({ message: 'Client nicht gefunden.' });
            }
            res.status(200).json(client);
        } catch (error) {
            console.error('Fehler beim Abrufen des Clients:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};

// Neuen Client erstellen
exports.createClient = async (req, res) => {
    // Autorisierung: Nur Manager, Admin dürfen Clients erstellen
    authorize(req, res, async () => {
        const { name, contact_person, email, phone, address } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Client Name ist erforderlich.' });
        }

        try {
            const newClient = await Client.create({ name, contact_person, email, phone, address });
            res.status(201).json({ message: 'Client erfolgreich erstellt.', client: newClient });
        } catch (error) {
            console.error('Fehler beim Erstellen des Clients:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']);
};

// Client aktualisieren
exports.updateClient = async (req, res) => {
    // Autorisierung: Nur Manager, Admin dürfen Clients aktualisieren
    authorize(req, res, async () => {
        const { id } = req.params;
        const { name, contact_person, email, phone, address } = req.body;

        try {
            const client = await Client.findByPk(id);
            if (!client) {
                return res.status(404).json({ message: 'Client nicht gefunden.' });
            }

            client.name = name !== undefined ? name : client.name;
            client.contact_person = contact_person !== undefined ? contact_person : client.contact_person;
            client.email = email !== undefined ? email : client.email;
            client.phone = phone !== undefined ? phone : client.phone;
            client.address = address !== undefined ? address : client.address;
            await client.save();

            res.status(200).json({ message: 'Client erfolgreich aktualisiert.' });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Clients:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']);
};

// Client löschen
exports.deleteClient = async (req, res) => {
    // Autorisierung: Nur Manager, Admin dürfen Clients löschen
    authorize(req, res, async () => {
        const { id } = req.params;
        try {
            const client = await Client.findByPk(id);
            if (!client) {
                return res.status(404).json({ message: 'Client nicht gefunden.' });
            }
            await client.destroy();
            res.status(200).json({ message: 'Client erfolgreich gelöscht.' });
        } catch (error) {
            console.error('Fehler beim Löschen des Clients:', error);
            // Fehlercode für referentielle Integrität, wenn z.B. noch Locations existieren
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                 return res.status(400).json({ message: 'Client kann nicht gelöscht werden, da noch zugehörige Einsatzorte existieren.' });
            }
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']);
};

// NEU: Clients für Dropdown abrufen (nur ID und Name)
exports.getClientsForDropdown = async (req, res) => {
    // Autorisierung: Nur Manager, Admin, Disponent dürfen Clients für Dropdown sehen
    authorize(req, res, async () => {
        try {
            const clients = await Client.findAll({
                attributes: ['id', 'name'], // Nur id und name abrufen
                order: [['name', 'ASC']]    // Optional: Nach Namen sortieren
            });
            res.status(200).json(clients);
        } catch (error) {
            console.error('Fehler beim Abrufen von Clients für Dropdown:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};
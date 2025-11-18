const Shift = require('../models/shiftModel');
const { Op } = require('sequelize');
// Dynamischer Import von node-fetch
const importFresh = new Function('modulePath', 'return import(modulePath)');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL;

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

// Hilfsfunktion zum Abrufen von Service-Daten
const fetchServiceData = async (url) => {
    const { default: fetch } = await importFresh('node-fetch');
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Entität nicht gefunden
            }
            const errorText = await response.text();
            throw new Error(`Fehler (${response.status}) beim Abrufen von ${url}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Fehler beim Fetch von ${url}:`, error.message);
        throw error; // Fehler weiterwerfen
    }
};

// Alle Schichten abrufen
exports.getAllShifts = async (req, res) => {
    authorize(req, res, async () => {
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id']; // Vom Gateway übermittelte User ID

        let whereClause = {};
        // Monteure sehen nur ihre eigenen Schichten
        if (userRoles.includes('Monteur')) {
            if (!userId) {
                return res.status(403).json({ message: 'Benutzer-ID fehlt für Monteur-Rolle.' });
            }
            whereClause = { user_id: userId };
        } else if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent'].includes(role))) {
            return res.status(403).json({ message: 'Keine Berechtigung, Schichten abzurufen.' });
        }

        try {
            const shifts = await Shift.findAll({ where: whereClause });

            const aggregatedShifts = await Promise.all(shifts.map(async shift => {
                const userPromise = fetchServiceData(`${AUTH_SERVICE_URL}/users/${shift.user_id}`);
                const jobPromise = shift.job_id ? fetchServiceData(`${JOB_SERVICE_URL}/jobs/${shift.job_id}`) : Promise.resolve(null);

                const [assignedUser, job] = await Promise.all([userPromise, jobPromise]);

                return {
                    ...shift.toJSON(),
                    assigned_username: assignedUser ? assignedUser.full_name : null,
                    assigned_user_pin: assignedUser ? assignedUser.pin : null,
                    job_title: job ? job.title : null,
                    job_number: job ? job.job_number : null,
                };
            }));

            res.status(200).json(aggregatedShifts);
        } catch (error) {
            console.error('Fehler beim Abrufen aller Schichten:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen der Schichten.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};

// Schicht nach ID abrufen
exports.getShiftById = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id'];

        try {
            const shift = await Shift.findByPk(id);
            if (!shift) {
                return res.status(404).json({ message: 'Schicht nicht gefunden.' });
            }

            // Monteure dürfen nur ihre eigenen Schichten sehen
            if (userRoles.includes('Monteur') && shift.user_id != userId) {
                return res.status(403).json({ message: 'Keine Berechtigung, diese Schicht zu sehen.' });
            }

            const userPromise = fetchServiceData(`${AUTH_SERVICE_URL}/users/${shift.user_id}`);
            const jobPromise = shift.job_id ? fetchServiceData(`${JOB_SERVICE_URL}/jobs/${shift.job_id}`) : Promise.resolve(null);

            const [assignedUser, job] = await Promise.all([userPromise, jobPromise]);

            res.status(200).json({
                ...shift.toJSON(),
                assigned_username: assignedUser ? assignedUser.full_name : null,
                assigned_user_pin: assignedUser ? assignedUser.pin : null,
                job_title: job ? job.title : null,
                job_number: job ? job.job_number : null,
            });
        } catch (error) {
            console.error('Fehler beim Abrufen der Schicht:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};

// Schichten für einen bestimmten Benutzer abrufen
exports.getShiftsByUserId = async (req, res) => {
    authorize(req, res, async () => {
        const { userId } = req.params;
        const requestingUserRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const requestingUserId = req.headers['x-user-id'];

        // Autorisierung: Monteur darf nur eigene Schichten abrufen
        if (requestingUserRoles.includes('Monteur') && requestingUserId != userId) {
            return res.status(403).json({ message: 'Keine Berechtigung, Schichten anderer Benutzer abzurufen.' });
        }

        try {
            const shifts = await Shift.findAll({ where: { user_id: userId } });

            const aggregatedShifts = await Promise.all(shifts.map(async shift => {
                const userPromise = fetchServiceData(`${AUTH_SERVICE_URL}/users/${shift.user_id}`);
                const jobPromise = shift.job_id ? fetchServiceData(`${JOB_SERVICE_URL}/jobs/${shift.job_id}`) : Promise.resolve(null);

                const [assignedUser, job] = await Promise.all([userPromise, jobPromise]);

                return {
                    ...shift.toJSON(),
                    assigned_username: assignedUser ? assignedUser.full_name : null,
                    assigned_user_pin: assignedUser ? assignedUser.pin : null,
                    job_title: job ? job.title : null,
                    job_number: job ? job.job_number : null,
                };
            }));

            res.status(200).json(aggregatedShifts);
        } catch (error) {
            console.error(`Fehler beim Abrufen von Schichten für Benutzer ${userId}:`, error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};


// Neue Schicht erstellen
exports.createShift = async (req, res) => {
    authorize(req, res, async () => {
        const { user_id, job_id, start_time, end_time, notes } = req.body;

        if (!user_id || !start_time || !end_time) {
            return res.status(400).json({ message: 'Benutzer-ID, Start- und Endzeit sind erforderlich.' });
        }

        try {
            // Prüfen, ob der zugewiesene Benutzer existiert
            const assignedUser = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${user_id}`);
            if (!assignedUser) {
                return res.status(404).json({ message: 'Zugewiesener Benutzer nicht gefunden.' });
            }

            // Optional: Prüfen, ob der Job existiert
            if (job_id) {
                const job = await fetchServiceData(`${JOB_SERVICE_URL}/jobs/${job_id}`);
                if (!job) {
                    return res.status(404).json({ message: 'Zugewiesener Job nicht gefunden.' });
                }
            }

            const newShift = await Shift.create({
                user_id,
                job_id,
                start_time,
                end_time,
                notes,
                status: 'PLANNED'
            });
            res.status(201).json({ message: 'Schicht erfolgreich erstellt.', shift: newShift });
        } catch (error) {
            console.error('Fehler beim Erstellen der Schicht:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Erstellen der Schicht.' });
        }
    }, ['Manager', 'Admin', 'Disponent']);
};

// Schicht aktualisieren
exports.updateShift = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        const { user_id, job_id, start_time, end_time, status, notes } = req.body;
        const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const userId = req.headers['x-user-id'];

        try {
            const shift = await Shift.findByPk(id);
            if (!shift) {
                return res.status(404).json({ message: 'Schicht nicht gefunden.' });
            }

            // Autorisierung prüfen:
            // Manager/Admin/Disponent dürfen alles, Monteure nur bestimmten Status ändern an ihren Schichten
            if (userRoles.includes('Monteur')) {
                if (shift.user_id != userId) {
                    return res.status(403).json({ message: 'Sie dürfen nur Ihre eigenen Schichten bearbeiten.' });
                }
                // Monteure dürfen nur den Status auf ACTIVE oder COMPLETED setzen,
                if (status && !['ACTIVE', 'COMPLETED'].includes(status)) {
                    return res.status(403).json({ message: 'Monteure dürfen den Status nur auf ACTIVE oder COMPLETED setzen.' });
                }
                // Monteure dürfen keine anderen Felder ändern (user_id, job_id, start_time, end_time, notes)
                if (user_id || job_id || start_time || end_time || notes) {
                    return res.status(403).json({ message: 'Monteure dürfen nur den Status ändern.' });
                }
            }

            // Validieren, ob zugewiesener Benutzer existiert (wenn user_id geändert wurde)
            if (user_id && user_id !== shift.user_id) {
                const assignedUser = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${user_id}`);
                if (!assignedUser) {
                    return res.status(404).json({ message: 'Zugewiesener Benutzer nicht gefunden.' });
                }
            }

            // Validieren, ob Job existiert (wenn job_id geändert wurde)
            if (job_id && job_id !== shift.job_id) {
                const job = await fetchServiceData(`${JOB_SERVICE_URL}/jobs/${job_id}`);
                if (!job) {
                    return res.status(404).json({ message: 'Zugewiesener Job nicht gefunden.' });
                }
            }

            shift.user_id = user_id !== undefined ? user_id : shift.user_id;
            shift.job_id = job_id !== undefined ? job_id : shift.job_id;
            shift.start_time = start_time !== undefined ? start_time : shift.start_time;
            shift.end_time = end_time !== undefined ? end_time : shift.end_time;
            shift.status = status !== undefined ? status : shift.status;
            shift.notes = notes !== undefined ? notes : shift.notes;

            await shift.save();
            res.status(200).json({ message: 'Schicht erfolgreich aktualisiert.' });
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Schicht:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Aktualisieren der Schicht.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']); // Monteure dürfen auch (eingeschränkt)
};

// Schicht löschen
exports.deleteShift = async (req, res) => {
    authorize(req, res, async () => {
        const { id } = req.params;
        try {
            const shift = await Shift.findByPk(id);
            if (!shift) {
                return res.status(404).json({ message: 'Schicht nicht gefunden.' });
            }
            await shift.destroy();
            res.status(200).json({ message: 'Schicht erfolgreich gelöscht.' });
        } catch (error) {
            console.error('Fehler beim Löschen der Schicht:', error);
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin']); // Nur Manager und Admin dürfen Schichten löschen
};

// Mögliche Schicht-Status abrufen
exports.getShiftStatuses = async (req, res) => {
    // Jeder authentifizierte Benutzer darf die Status abrufen
    authorize(req, res, async () => {
        // Status sind im ENUM definiert, direkt aus dem Modell holen
        const statuses = Shift.getAttributes().status.values;
        res.status(200).json(statuses);
    }, ['Manager', 'Admin', 'Disponent', 'Monteur']);
};
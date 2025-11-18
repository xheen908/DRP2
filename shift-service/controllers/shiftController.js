// DRP2/shift-service/controllers/shiftController.js
const Shift = require('../models/shiftModel');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
// Dynamischer Import von node-fetch
const importFresh = new Function('modulePath', 'return import(modulePath)');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
// JOB_SERVICE_URL wird hier nicht mehr direkt benötigt, da Shifts nicht an Jobs gekoppelt sind im ursprünglichen Modell

// Hilfsfunktion zur Autorisierung basierend auf X-User-Roles Header
const authorize = (req, res, next, requiredRoles) => {
    const userRolesHeader = req.headers['x-user-roles'];
    if (!userRolesHeader) {
        console.error('[ShiftController - Authorize] Autorisierungsinformationen fehlen (X-User-Roles Header nicht vorhanden).');
        return res.status(403).json({ message: 'Autorisierungsinformationen fehlen.' });
    }
    const userRoles = userRolesHeader.split(',');
    const hasPermission = userRoles.some(role => requiredRoles.includes(role));
    if (hasPermission) {
        next();
    } else {
        console.warn(`[ShiftController - Authorize] Benutzer mit Rollen [${userRoles.join(', ')}] hat keine ausreichenden Berechtigungen für diese Aktion. Benötigt: [${requiredRoles.join(', ')}]`);
        res.status(403).json({ message: 'Keine ausreichenden Berechtigungen für diese Aktion.' });
    }
};

// Hilfsfunktion zum Abrufen von Service-Daten (für Benutzerinformationen)
// Akzeptiert jetzt einen optionalen headers-Parameter
const fetchServiceData = async (url, headers = {}) => {
    const { default: fetch } = await importFresh('node-fetch');
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404) {
                console.warn(`[ShiftController - fetchServiceData] Entität nicht gefunden für URL: ${url}`);
                return null; // Entität nicht gefunden
            }
            console.error(`[ShiftController - fetchServiceData] Fehler (${response.status}) beim Abrufen von ${url}: ${errorText}`);
            throw new Error(`Fehler (${response.status}) beim Abrufen von ${url}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[ShiftController - fetchServiceData] Fehler beim Fetch von ${url}:`, error.message);
        throw error; // Fehler weiterwerfen
    }
};

// NEU: Verarbeitet den Schicht-Check-in eines Mitarbeiters.
exports.checkInShift = async (req, res) => {
    authorize(req, res, async () => {
        const { employee_id, check_in_time, check_in_latitude, check_in_longitude, badge_id_scanned } = req.body;

        if (!employee_id || !check_in_time || !check_in_latitude || !check_in_longitude || !badge_id_scanned) {
            return res.status(400).json({ message: 'Alle Check-in-Daten sind erforderlich.' });
        }

        try {
            const today = moment().tz('Europe/Berlin').format('YYYY-MM-DD');

            const formatted_check_in_time = moment(check_in_time).tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');

            // Prüfen, ob Mitarbeiter bereits heute eingestempelt hat und noch nicht ausgestempelt ist
            const existingOpenShift = await Shift.findOne({
                where: {
                    employee_id: employee_id,
                    date: today,
                    check_out_time: { [Op.is]: null }
                }
            });

            if (existingOpenShift) {
                return res.status(409).json({ message: 'Sie sind heute bereits eingestempelt und noch nicht ausgestempelt.' });
            }

            const newShift = await Shift.create({
                employee_id,
                check_in_time: formatted_check_in_time,
                check_in_latitude: parseFloat(check_in_latitude),
                check_in_longitude: parseFloat(check_in_longitude),
                badge_id_scanned,
                date: today
            });

            res.status(201).json({ message: 'Schicht-Check-in erfolgreich!', shift: newShift });

        } catch (error) {
            console.error('Fehler beim Schicht-Check-in:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Schicht-Check-in.' });
        }
    }, ['Monteur', 'Reinigungskraft']); // Rollen anpassen, falls nötig
};

// NEU: Verarbeitet den Schicht-Check-out eines Mitarbeiters.
exports.checkOutShift = async (req, res) => {
    authorize(req, res, async () => {
        const { employee_id, check_out_time, check_out_latitude, check_out_longitude, badge_id_scanned } = req.body;

        if (!employee_id || !check_out_time || !check_out_latitude || !check_out_longitude || !badge_id_scanned) {
            return res.status(400).json({ message: 'Alle Check-out-Daten sind erforderlich.' });
        }

        try {
            const today = moment().tz('Europe/Berlin').format('YYYY-MM-DD');

            const existingOpenShift = await Shift.findOne({
                where: {
                    employee_id: employee_id,
                    date: today,
                    check_out_time: { [Op.is]: null }
                },
                order: [['check_in_time', 'DESC']] // Neuesten offenen Check-in finden
            });

            if (!existingOpenShift) {
                return res.status(404).json({ message: 'Keine offene Schicht für den heutigen Tag gefunden. Bitte zuerst einchecken.' });
            }

            // Optional: Verifikation der gescannten Badge-ID (falls gewünscht)
            // if (existingOpenShift.badge_id_scanned !== badge_id_scanned) {
            //     return res.status(401).json({ message: 'Fehler: Gescanntes Badge stimmt nicht mit Check-in-Badge überein.' });
            // }\

            const formatted_check_out_time = moment(check_out_time).tz('Europe/Berlin').format('YYYY-MM-DD HH:mm:ss');

            existingOpenShift.check_out_time = formatted_check_out_time;
            existingOpenShift.check_out_latitude = parseFloat(check_out_latitude);
            existingOpenShift.check_out_longitude = parseFloat(check_out_longitude);
            await existingOpenShift.save();

            res.status(200).json({ message: 'Schicht-Check-out erfolgreich!', shift_id: existingOpenShift.id });

        } catch (error) {
            console.error('Fehler beim Schicht-Check-out:', error);
            res.status(500).json({ message: 'Interner Serverfehler beim Schicht-Check-out.' });
        }
    }, ['Monteur', 'Reinigungskraft']);
};

// NEU: Ruft alle Schichten für einen bestimmten Mitarbeiter ab.
exports.getShiftsByUserId = async (req, res) => {
    // SEHR FRÜHER LOG, um zu prüfen, ob die Funktion überhaupt erreicht wird
    console.log(`[ShiftController - getShiftsByUserId] Anfrage erhalten für userId: ${req.params.userId}`);

    authorize(req, res, async () => {
        const { userId } = req.params; // Dies ist jetzt employeeId
        const requestingUserRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const requestingUserId = req.headers['x-user-id'];

        // WICHTIG: Überprüfung des AUTH_SERVICE_URL
        if (!AUTH_SERVICE_URL) {
            console.error('[ShiftController - getShiftsByUserId] FEHLER: AUTH_SERVICE_URL ist nicht gesetzt. Kann Benutzerdetails nicht abrufen.');
            return res.status(500).json({ message: 'Interner Konfigurationsfehler: AUTH Service URL fehlt.' });
        }

        if (!userId) {
            console.warn('[ShiftController - getShiftsByUserId] Mitarbeiter-ID ist erforderlich, aber fehlte.');
            return res.status(400).json({ message: 'Mitarbeiter-ID ist erforderlich.' });
        }

        // Autorisierung: Monteur darf nur eigene Schichten abrufen
        if (requestingUserRoles.includes('Monteur') && requestingUserId != userId) {
            console.warn(`[ShiftController - getShiftsByUserId] Monteur ${requestingUserId} versucht, Schichten von Benutzer ${userId} abzurufen.`);
            return res.status(403).json({ message: 'Keine Berechtigung, Schichten anderer Benutzer abzurufen.' });
        }

        try {
            const shifts = await Shift.findAll({
                where: { employee_id: userId },
                order: [['date', 'DESC'], ['check_in_time', 'DESC']]
            });

            const headersForAuthService = {
                'X-User-Roles': requestingUserRoles.join(','), 
                'X-User-ID': requestingUserId,
                'Authorization': req.headers['authorization']
            };

            const aggregatedShifts = await Promise.all(shifts.map(async shift => {
                 // fetchServiceData jetzt mit den Headern aufrufen
                 const user = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${shift.employee_id}`, headersForAuthService);
                 return {
                     ...shift.toJSON(),
                     employee_full_name: user ? user.full_name : 'Unbekannt',
                     employee_pin: user ? user.pin : 'N/A', // Um die PIN zu bekommen, wenn nötig
                 };
            }));

            console.log(`[ShiftController - getShiftsByUserId] Erfolgreich Schichten für Benutzer ${userId} abgerufen und aggregiert.`);
            res.status(200).json(aggregatedShifts);
        } catch (error) {
            console.error(`[ShiftController - getShiftsByUserId] FEHLER beim Abrufen von Schichten für Benutzer ${userId}:`, error.message, error.stack);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Schichtstatus.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']);
};

// NEU: Ruft den aktuellen Schichtstatus eines Mitarbeiters ab.
exports.getCurrentShiftStatus = async (req, res) => {
    console.log(`[ShiftController - getCurrentShiftStatus] Anfrage erhalten für userId: ${req.params.userId}`);

    authorize(req, res, async () => {
        const { userId } = req.params;
        const requestingUserId = req.headers['x-user-id'];

        if (!userId) {
            console.warn('[ShiftController - getCurrentShiftStatus] Mitarbeiter-ID ist erforderlich, aber fehlte.');
            return res.status(400).json({ message: 'Mitarbeiter-ID ist erforderlich.' });
        }

        // Autorisierung: Ein Benutzer darf nur seinen eigenen Schichtstatus abrufen.
        if (requestingUserId != userId) {
            console.warn(`[ShiftController - getCurrentShiftStatus] Benutzer ${requestingUserId} versucht, Schichtstatus von Benutzer ${userId} abzurufen.`);
            return res.status(403).json({ message: 'Keine Berechtigung, den Schichtstatus anderer Benutzer abzurufen.' });
        }

        try {
            const today = moment().tz('Europe/Berlin').format('YYYY-MM-DD');
            const openShift = await Shift.findOne({
                where: {
                    employee_id: userId,
                    date: today,
                    check_out_time: { [Op.is]: null }
                }
            });

            if (openShift) {
                console.log(`[ShiftController - getCurrentShiftStatus] Offene Schicht gefunden für Benutzer ${userId}.`);
                res.status(200).json({ message: 'Offene Schicht gefunden.', shifts: [openShift.toJSON()], hasOpenShift: true });
            } else {
                console.log(`[ShiftController - getCurrentShiftStatus] Keine offene Schicht gefunden für Benutzer ${userId}.`);
                res.status(404).json({ message: 'Keine offene Schicht gefunden.', shifts: [], hasOpenShift: false });
            }
        } catch (error) {
            console.error(`[ShiftController - getCurrentShiftStatus] FEHLER beim Abrufen des Schichtstatus für Benutzer ${userId}:`, error.message, error.stack);
            res.status(500).json({ message: 'Interner Serverfehler beim Abrufen des Schichtstatus.' });
        }
    }, ['Monteur', 'Reinigungskraft', 'Manager', 'Admin', 'Disponent']); // Alle relevanten Rollen
};

// Entfernen Sie getAllShifts, getShiftById, createShift, updateShift, getShiftStatuses
// oder passen Sie sie an das neue Schema an, falls sie noch benötigt werden
// und sich nicht mit der ursprünglichen Funktionalität überschneiden.
// Für diese Aufgabe konzentrieren wir uns auf die Wiederherstellung der ursprünglichen Zeiterfassungslogik.
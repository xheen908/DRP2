// DRP2/shift-service/controllers/shiftController.js
const Shift = require('../models/shiftModel');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const importFresh = new Function('modulePath', 'return import(modulePath)');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Feiertage 2026 (NRW)
const HOLIDAYS_2026 = [
    '2026-01-01', // Neujahr
    '2026-04-03', // Karfreitag
    '2026-04-06', // Ostermontag
    '2026-05-01', // Tag der Arbeit
    '2026-05-14', // Christi Himmelfahrt
    '2026-05-25', // Pfingstmontag
    '2026-06-04', // Fronleichnam
    '2026-10-03', // Tag der Deutschen Einheit
    '2026-11-01', // Allerheiligen
    '2026-12-25', // 1. Weihnachtstag
    '2026-12-26'  // 2. Weihnachtstag
];

// Hilfsfunktion zur Prüfung auf Feiertag
const isHoliday = (dateMoment) => {
    const dateStr = dateMoment.format('YYYY-MM-DD');
    return HOLIDAYS_2026.includes(dateStr);
};

// Hilfsfunktion zur Berechnung von Arbeitszeit und Zuschlägen (SFN)
const calculateShiftDetails = (start, end, existingBreakMinutes = 0) => {
    const startTime = moment(start).tz('Europe/Berlin');
    const endTime = moment(end).tz('Europe/Berlin');
    
    let totalMinutes = endTime.diff(startTime, 'minutes');
    if (totalMinutes <= 0) return { total_work_hours: 0, night_hours: 0, sunday_hours: 0, holiday_hours: 0, break_duration_minutes: 0 };

    // Gesetzliche Pausenregelung (ArbZG)
    let breakMinutes = existingBreakMinutes;
    const grossHours = totalMinutes / 60;
    
    if (grossHours > 9) {
        breakMinutes = Math.max(breakMinutes, 45);
    } else if (grossHours > 6) {
        breakMinutes = Math.max(breakMinutes, 30);
    }
    
    let netWorkMinutes = totalMinutes - breakMinutes;
    const total_work_hours = Math.max(0, netWorkMinutes / 60);

    // SFN Zuschläge Berechnung
    let night_hours = 0;
    let sunday_hours = 0;
    let holiday_hours = 0;

    let current = moment(startTime);
    while (current.isBefore(endTime)) {
        const nextHour = moment(current).add(1, 'minute');
        const durationMin = 1;
        const durationHours = durationMin / 60;

        const hour = current.hour();
        const day = current.day(); // 0 = Sunday
        const dateStr = current.format('YYYY-MM-DD');

        // Nachtarbeit: 20:00 - 06:00
        if (hour >= 20 || hour < 6) {
            night_hours += durationHours;
        }

        // Feiertagsarbeit (höhere Priorität als Sonntag laut EStG oft sinnvoll für Abrechnung)
        if (HOLIDAYS_2026.includes(dateStr)) {
            holiday_hours += durationHours;
        } else if (day === 0) {
            // Sonntagsarbeit (nur wenn kein Feiertag)
            sunday_hours += durationHours;
        }

        current = nextHour;
    }

    return {
        total_work_hours: parseFloat(total_work_hours.toFixed(2)),
        night_hours: parseFloat(night_hours.toFixed(2)),
        sunday_hours: parseFloat(sunday_hours.toFixed(2)),
        holiday_hours: parseFloat(holiday_hours.toFixed(2)),
        break_duration_minutes: breakMinutes
    };
};

// Hilfsfunktion zur Autorisierung
const authorize = (req, res, next, requiredRoles) => {
    const userRolesHeader = req.headers['x-user-roles'];
    if (!userRolesHeader) return res.status(403).json({ message: 'Autorisierungsinformationen fehlen.' });
    const userRoles = userRolesHeader.split(',');
    const hasPermission = userRoles.some(role => requiredRoles.includes(role));
    if (hasPermission) next();
    else res.status(403).json({ message: 'Keine ausreichenden Berechtigungen.' });
};

const fetchServiceData = async (url, headers = {}) => {
    const { default: fetch } = await importFresh('node-fetch');
    try {
        const response = await fetch(url, { headers });
        return response.ok ? await response.json() : null;
    } catch (error) {
        console.error(`[ShiftController] Fetch Fehler:`, error.message);
        throw error;
    }
};

exports.getShiftsByUserId = async (req, res) => {
    authorize(req, res, async () => {
        const { userId } = req.params;
        const requestingUserRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
        const requestingUserId = req.headers['x-user-id'];

        if (requestingUserRoles.includes('Monteur') && requestingUserId != userId) {
            return res.status(403).json({ message: 'Keine Berechtigung.' });
        }

        try {
            const shifts = await Shift.findAll({
                where: { user_id: userId },
                order: [['start_time', 'DESC']]
            });

            const headersForAuthService = {
                'X-User-Roles': requestingUserRoles.join(','), 
                'X-User-ID': requestingUserId,
                'Authorization': req.headers['authorization']
            };

            const aggregatedShifts = await Promise.all(shifts.map(async (shift, index) => {
                 const user = await fetchServiceData(`${AUTH_SERVICE_URL}/users/${shift.user_id}`, headersForAuthService);
                 
                 let restPeriodViolation = false;
                 if (index < shifts.length - 1) {
                     const previousShift = shifts[index + 1];
                     if (previousShift.end_time) {
                         const diff = moment(shift.start_time).diff(moment(previousShift.end_time), 'hours', true);
                         if (diff < 11) restPeriodViolation = true;
                     }
                 }

                 return {
                     ...shift.toJSON(),
                     employee_full_name: user ? user.full_name : 'Unbekannt',
                     restPeriodViolation
                 };
            }));

            res.status(200).json(aggregatedShifts);
        } catch (error) {
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft']);
};

exports.getCurrentShiftStatus = async (req, res) => {
    authorize(req, res, async () => {
        const { userId } = req.params;
        const requestingUserId = req.headers['x-user-id'];
        if (requestingUserId != userId) return res.status(403).json({ message: 'Keine Berechtigung.' });

        try {
            const openShift = await Shift.findOne({
                where: {
                    user_id: userId,
                    status: { [Op.not]: 'Abgeschlossen' }
                },
                order: [['start_time', 'DESC']]
            });

            if (openShift) {
                res.status(200).json({ message: 'Aktive Schicht gefunden.', shifts: [openShift.toJSON()], hasOpenShift: true });
            } else {
                res.status(404).json({ message: 'Keine aktive Schicht.', shifts: [], hasOpenShift: false });
            }
        } catch (error) {
            res.status(500).json({ message: 'Interner Serverfehler.' });
        }
    }, ['Monteur', 'Reinigungskraft', 'Manager', 'Admin', 'Disponent']);
};

exports.checkInShift = async (req, res) => {
    authorize(req, res, async () => {
        const { user_id, start_time, notes } = req.body;
        if (!user_id) return res.status(400).json({ message: 'User ID erforderlich.' });

        try {
            const newShift = await Shift.create({
                user_id,
                start_time: start_time || new Date(),
                status: 'Bestätigt',
                notes: notes || 'Check-in via System'
            });
            res.status(201).json(newShift);
        } catch (error) {
            res.status(500).json({ message: 'Fehler beim Check-in.' });
        }
    }, ['Monteur', 'Reinigungskraft', 'Manager', 'Admin']);
};

exports.checkOutShift = async (req, res) => {
    authorize(req, res, async () => {
        const { user_id, end_time, break_minutes } = req.body;
        if (!user_id) return res.status(400).json({ message: 'User ID erforderlich.' });

        try {
            const shift = await Shift.findOne({
                where: { user_id, status: { [Op.not]: 'Abgeschlossen' } },
                order: [['start_time', 'DESC']]
            });

            if (!shift) return res.status(404).json({ message: 'Keine offene Schicht gefunden.' });

            const endTime = end_time || new Date();
            const details = calculateShiftDetails(shift.start_time, endTime, break_minutes || 0);

            await shift.update({
                end_time: endTime,
                status: 'Abgeschlossen',
                ...details
            });

            res.status(200).json({ message: 'Check-out erfolgreich.', shift });
        } catch (error) {
            res.status(500).json({ message: 'Fehler beim Check-out.' });
        }
    }, ['Monteur', 'Reinigungskraft', 'Manager', 'Admin']);
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/userModel');
const { sequelize } = require('../config/sequelize'); // Für Transaktionen, falls nötig
const { Op } = require('sequelize'); // Für erweiterte Query-Operatoren
const { default: fetch } = require('node-fetch'); // node-fetch für HTTP-Anfragen

require('dotenv').config(); // Um HR_SERVICE_URL zu lesen

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('Auth Controller: JWT_SECRET ist nicht gesetzt!');
    process.exit(1);
}

const HR_SERVICE_URL = process.env.HR_SERVICE_URL || 'http://hr-service:3008'; // Interne URL für den HR Service

// Hilfsfunktion zum Abrufen von ALLE Mitarbeiterdaten vom HR Service
async function fetchEmployeeDataFromHrService(userId, authHeader) {
    try {
        console.log(`[Auth Service Debug] Versuche, ALLE Mitarbeiterdaten vom HR Service für userId ${userId} abzurufen unter URL: ${HR_SERVICE_URL}/api/hr/employees/user/${userId}`);
        const hrServiceResponse = await fetch(`${HR_SERVICE_URL}/api/hr/employees/user/${userId}`, {
            headers: {
                'Authorization': authHeader // Weiterleitung des Auth Headers für Autorisierung
            }
        });

        if (!hrServiceResponse.ok) {
            const errorData = await hrServiceResponse.json();
            console.error(`[Auth Service Debug] Fehler (${hrServiceResponse.status}) beim Abrufen der Mitarbeiterdaten für User ID ${userId} vom HR Service:`, errorData);
            return null;
        }

        const employeeData = await hrServiceResponse.json();
        console.log(`[Auth Service Debug] Empfangene Rohdaten vom HR Service für userId ${userId}:`, JSON.stringify(employeeData, null, 2));

        return employeeData; // Das gesamte Employee-Objekt zurückgeben
    } catch (fetchError) {
        console.error(`[Auth Service Debug] Netzwerkfehler beim Aufruf des HR Service für User ID ${userId}:`, fetchError);
        return null;
    }
}

// Hilfsfunktion zur Generierung einer zufälligen 4-10 stelligen PIN
const generatePin = async () => {
    let pin;
    let isUnique = false;
    while (!isUnique) {
        // Generiere eine 6-stellige PIN
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        // Überprüfe, ob die PIN bereits existiert
        const existingUser = await User.findOne({ where: { pin } });
        if (!existingUser) {
            isUnique = true;
        }
    }
    return pin;
};

// Registrierung eines neuen Benutzers
exports.register = async (req, res) => {
    const { 
        email, password, roleId, // Auth Service Daten
        firstName, lastName, gender, maritalStatus, nationality,
        dateOfBirth, privatePhone, dateOfHire, department,
        workLocation, workScheduleType, annualLeaveEntitlement,
        salary, status, // HR Service Daten (status ersetzt employeeStatus)
        addresses, bankDetails, taxSocialSecurity, emergencyContacts // NEU: Verknüpfte HR Service Daten
    } = req.body; 

    // Einfache Validierung
    if (!password || !roleId || !firstName || !lastName || !dateOfHire) {
        return res.status(400).json({ message: 'Passwort, Rolle, Vorname, Nachname und Einstellungsdatum sind erforderlich.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    try {
        // NEU: isActive wird basierend auf dem HR-Status abgeleitet
        const isActiveDerived = (status !== 'inactive' && status !== 'terminated');

        // Schritt 1: Benutzer im Auth Service erstellen
        const hashedPassword = await bcrypt.hash(password, 10);
        const generatedPin = await generatePin(); 

        const newUser = await User.create({
            email: email,
            pin: generatedPin,
            password: hashedPassword,
            role_id: roleId,
            isActive: isActiveDerived // Verwende den abgeleiteten isActive Status
        });

        // Schritt 2: Mitarbeiterdaten im HR Service erstellen
        // Sende alle relevanten HR-Daten, einschließlich der neuen Felder und assoziierten Daten
        const hrServiceResponse = await fetch(`${HR_SERVICE_URL}/api/hr/employees`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization'] // Auth Header weiterleiten
            },
            body: JSON.stringify({
                userId: newUser.id,
                firstName,
                lastName,
                email,
                gender,           // NEU
                maritalStatus,    // NEU
                nationality,      // NEU
                dateOfBirth,
                privatePhone,     // NEU
                dateOfHire,
                department,
                workLocation,     // NEU
                workScheduleType, // NEU
                annualLeaveEntitlement, // NEU
                salary,
                status,
                addresses,        // NEU: Verknüpfte Daten
                bankDetails,      // NEU: Verknüpfte Daten
                taxSocialSecurity, // NEU: Verknüpfte Daten
                emergencyContacts  // NEU: Verknüpfte Daten
            })
        });

        if (!hrServiceResponse.ok) {
            const errorData = await hrServiceResponse.json();
            // Wenn HR Service Fehler hat, Auth Service Benutzer zurückrollen (optional, aber empfohlen)
            await newUser.destroy(); 
            console.error(`[Auth Service] Fehler beim Erstellen des HR-Eintrags für User ID ${newUser.id}:`, errorData);
            return res.status(hrServiceResponse.status).json({ message: errorData.message || 'Fehler beim Erstellen der Mitarbeiterdaten im HR Service.' });
        }

        return res.status(201).json({
            message: 'Benutzer und Mitarbeiter erfolgreich registriert.',
            userId: newUser.id,
            pin: newUser.pin 
        });

    } catch (error) {
        console.error('Fehler bei der Benutzerregistrierung:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'E-Mail oder PIN bereits vergeben.' });
        }
        res.status(500).json({ message: 'Interner Serverfehler bei der Registrierung.' });
    }
};

// Benutzer-Login
exports.login = async (req, res) => {
    const { pin, password } = req.body;

    if (!pin || !password) {
        return res.status(400).json({ message: 'PIN und Passwort sind erforderlich.' });
    }

    try {
        const user = await User.findOne({
            where: { pin: pin },
            include: [{ model: Role, as: 'role' }] 
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Ungültige PIN oder Benutzer inaktiv.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültiges Passwort.' });
        }

        // Vollständigen Namen vom HR Service abrufen
        const authHeader = req.headers['authorization']; 
        const employeeData = await fetchEmployeeDataFromHrService(user.id, authHeader);
        const fullName = employeeData ? `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() : null;

        console.log(`[Auth Service Debug] Login: fullName für User ${user.id}: ${fullName}`);


        const token = jwt.sign(
            { id: user.id, username: fullName, email: user.email, roles: [user.role.name] }, 
            JWT_SECRET,
            { expiresIn: '1d' } 
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 24 * 60 * 60 * 1000, 
            sameSite: 'Lax' 
        });

        return res.status(200).json({
            message: 'Login erfolgreich.',
            token: token, 
            user: {
                id: user.id,
                username: fullName,
                email: user.email,
                roles: [user.role.name]
            },
            redirectTo: '/dashboard' 
        });

    } catch (error) {
        console.error('Fehler beim Login:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Login.' });
    }
};

// Benutzer-Logout
exports.logout = async (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    return res.status(200).json({ message: 'Abmeldung erfolgreich.', redirectTo: '/' });
};

// Token-Validierung (Wird vom API Gateway intern aufgerufen)
exports.validateToken = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ isValid: false, message: 'Token nicht validiert oder Benutzerdaten fehlen.' });
    }

    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'isActive'], 
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ isValid: false, message: 'Benutzer inaktiv oder nicht gefunden.' });
        }

        // Vollständigen Namen vom HR Service abrufen
        const authHeader = req.headers['authorization']; 
        const employeeData = await fetchEmployeeDataFromHrService(user.id, authHeader);
        const fullName = employeeData ? `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() : null;
        console.log(`[Auth Service Debug] validateToken: fullName für User ${user.id}: ${fullName}`);


        return res.status(200).json({
            isValid: true,
            user: {
                id: user.id,
                username: fullName, 
                email: user.email,
                roles: user.role ? [user.role.name] : []
            }
        });
    } catch (error) {
        console.error('Fehler bei der Token-Validierung im Auth Service:', error);
        res.status(500).json({ isValid: false, message: 'Interner Serverfehler bei der Token-Validierung.' });
    }
};

// Alle Benutzer abrufen
exports.getAllUsers = async (req, res) => {
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer abzurufen.' });
    }

    try {
        const users = await User.findAll({
            attributes: ['id', 'pin', 'isActive'], 
            include: [{ model: Role, as: 'role', attributes: ['name', 'id'] }] 
        });

        const formattedUsers = await Promise.all(users.map(async user => {
            console.log(`[Auth Service Debug] Raw User Data from DB for User ID ${user.id}:`, JSON.stringify(user.toJSON(), null, 2));

            const authHeader = req.headers['authorization'];
            const employeeData = await fetchEmployeeDataFromHrService(user.id, authHeader);
            const fullName = employeeData ? `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() : null;

            console.log(`[Auth Service Debug] getAllUsers: fullName für User ${user.id}: ${fullName}`);
            return {
                id: user.id,
                full_name: fullName, 
                pin: user.pin,
                role_id: user.role ? user.role.id : null, 
                role_name: user.role ? user.role.name : 'N/A',
                isActive: user.isActive,
                hr_data: employeeData 
            };
        }));
        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error('Fehler beim Abrufen aller Benutzer:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Benutzerdetails abrufen (für Bearbeiten)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft'].includes(role))) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzerdetails abzurufen.' });
    }

    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'pin', 'role_id', 'isActive'], 
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        console.log(`[Auth Service Debug] Raw User Data from DB for User ID ${user.id}:`, JSON.stringify(user.toJSON(), null, 2));


        // Vollständige Mitarbeiterdaten vom HR Service abrufen
        const authHeader = req.headers['authorization'];
        const employeeData = await fetchEmployeeDataFromHrService(user.id, authHeader);
        const fullName = employeeData ? `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() : null;

        console.log(`[Auth Service Debug] getUserById: fullName für User ${user.id}: ${fullName}`);


        res.status(200).json({
            id: user.id,
            full_name: fullName, 
            pin: user.pin,
            role_id: user.role_id,
            role_name: user.role.name,
            isActive: user.isActive,
            hr_data: employeeData 
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Benutzer aktualisieren
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { 
        role_id, pin, // Auth Service Daten (PIN hinzugefügt)
        firstName, lastName, email, gender, maritalStatus, nationality,
        dateOfBirth, privatePhone, dateOfHire, department,
        workLocation, workScheduleType, annualLeaveEntitlement,
        salary, status, // HR Service Daten
        addresses, bankDetails, taxSocialSecurity, emergencyContacts // NEU: Verknüpfte HR Service Daten
    } = req.body; 
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer zu aktualisieren.' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        // NEU: isActive wird basierend auf dem empfangenen HR-Status abgeleitet
        const isActiveDerived = (status !== 'inactive' && status !== 'terminated');

        // Schritt 1: Auth Service Daten aktualisieren
        user.role_id = role_id !== undefined ? role_id : user.role_id;
        user.isActive = isActiveDerived; // Verwende den abgeleiteten isActive Status
        if (pin && pin !== user.pin) { // Aktualisiere PIN nur, wenn sie sich geändert hat
            user.pin = pin;
        }
        await user.save();

        // Schritt 2: HR Service Daten aktualisieren
        const hrServiceResponse = await fetch(`${HR_SERVICE_URL}/api/hr/employees/user/${id}`, { 
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization'] // Auth Header weiterleiten
            },
            body: JSON.stringify({
                firstName, lastName, email, gender, maritalStatus, nationality,
                dateOfBirth, privatePhone, dateOfHire, department,
                workLocation, workScheduleType, annualLeaveEntitlement,
                salary, status,
                addresses, bankDetails, taxSocialSecurity, emergencyContacts // NEU: Verknüpfte Daten
            })
        });

        if (!hrServiceResponse.ok) {
            const errorData = await hrServiceResponse.json();
            console.error(`[Auth Service] Fehler beim Aktualisieren der HR-Daten für User ID ${id}:`, errorData);
            return res.status(hrServiceResponse.status).json({ message: errorData.message || 'Fehler beim Aktualisieren der Mitarbeiterdaten im HR Service.' });
        }


        res.status(200).json({ message: 'Benutzer und Mitarbeiterdaten erfolgreich aktualisiert.' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzers:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Passwort eines Benutzers aktualisieren
exports.updateUserPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Passwort zu aktualisieren.' });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Neues Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Passwort erfolgreich aktualisiert.' });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzerpassworts:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};


// Benutzer löschen
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer zu löschen.' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }
        
        // Schritt 1: Benutzer im Auth Service löschen
        await user.destroy();

        // Schritt 2: Entsprechenden Mitarbeiter im HR Service löschen
        const hrServiceResponse = await fetch(`${HR_SERVICE_URL}/api/hr/employees/user/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': req.headers['authorization'] }
        });

        if (!hrServiceResponse.ok && hrServiceResponse.status !== 404) { // 404 ist OK, wenn kein HR-Eintrag existiert
            const errorData = await hrServiceResponse.json();
            console.error(`[Auth Service] Fehler beim Löschen des HR-Eintrags für User ID ${id}:`, errorData);
            // Hier könnten Sie überlegen, ob Sie den Auth-Benutzer zurückrollen müssen
        }

        res.status(200).json({ message: 'Benutzer und zugehörige Mitarbeiterdaten erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Alle Rollen abrufen
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({ attributes: ['id', 'name'] });
        res.status(200).json(roles);
    } catch (error) {
        console.error('Fehler beim Abrufen aller Rollen:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Endpunkt für Benutzer, die für Zuweisungen in anderen Services relevant sind (z.B. Job Service)
exports.getUsersForAssignment = async (req, res) => {
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent', 'Monteur', 'Reinigungskraft'].includes(role))) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer für Zuweisung abzurufen.' });
    }

    try {
        const users = await User.findAll({
            where: { isActive: true }, 
            attributes: ['id', 'pin', 'isActive'], 
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });

        const formattedUsers = await Promise.all(users.map(async user => {
            const authHeader = req.headers['authorization'];
            const employeeData = await fetchEmployeeDataFromHrService(user.id, authHeader);
            const fullName = employeeData ? `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() : null;

            console.log(`[Auth Service Debug] getUsersForAssignment: fullName für User ${user.id}: ${fullName}`);
            return {
                id: user.id,
                full_name: fullName, 
                pin: user.pin,
                role_id: user.role ? user.role.id : null, 
                role_name: user.role ? user.role.name : 'N/A',
                isActive: user.isActive, 
                hr_data: employeeData 
            };
        }));

        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer für Zuweisung:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};
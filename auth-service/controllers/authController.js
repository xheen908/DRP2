const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/userModel');
const { sequelize } = require('../config/sequelize'); // Für Transaktionen, falls nötig
const { Op } = require('sequelize'); // Für erweiterte Query-Operatoren

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('Auth Controller: JWT_SECRET ist nicht gesetzt!');
    process.exit(1);
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
    const { fullName, email, password, roleId, isActive } = req.body; // PIN wird automatisch generiert

    // Einfache Validierung
    if (!fullName || !password || !roleId) {
        return res.status(400).json({ message: 'Name, Passwort und Rolle sind erforderlich.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const generatedPin = await generatePin(); // Automatisch eine PIN generieren

        const newUser = await User.create({
            full_name: fullName,
            email: email,
            pin: generatedPin,
            password: hashedPassword,
            role_id: roleId,
            isActive: isActive !== undefined ? isActive : true // Standardmäßig aktiv
        });

        // Optional: Token für den neuen Benutzer direkt zurückgeben oder ihn zum Login auffordern
        // Für diese Route geben wir nur eine Erfolgsmeldung und die generierte PIN zurück.
        return res.status(201).json({
            message: 'Benutzer erfolgreich registriert.',
            userId: newUser.id,
            pin: newUser.pin // Die generierte PIN zurückgeben
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
        // Benutzer anhand der PIN finden
        const user = await User.findOne({
            where: { pin: pin },
            include: [{ model: Role, as: 'role' }] // Rolle des Benutzers laden
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Ungültige PIN oder Benutzer inaktiv.' });
        }

        // Passwort vergleichen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültiges Passwort.' });
        }

        // JWT-Token generieren
        const token = jwt.sign(
            { id: user.id, username: user.full_name, email: user.email, roles: [user.role.name] }, // Payload
            JWT_SECRET,
            { expiresIn: '1d' } // Token gültig für 1 Tag
        );

        // JWT als HttpOnly Cookie setzen
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // In Produktion nur über HTTPS senden
            maxAge: 24 * 60 * 60 * 1000, // 1 Tag
            sameSite: 'Lax' // Oder 'None' + secure: true für Cross-Site
        });

        return res.status(200).json({
            message: 'Login erfolgreich.',
            token: token, // Token auch im Body für mobile Apps oder Debugging
            user: {
                id: user.id,
                username: user.full_name,
                email: user.email,
                roles: [user.role.name]
            },
            redirectTo: '/dashboard' // Für EJS Frontend
        });

    } catch (error) {
        console.error('Fehler beim Login:', error);
        res.status(500).json({ message: 'Interner Serverfehler beim Login.' });
    }
};

// Benutzer-Logout
exports.logout = async (req, res) => {
    // Einfach das JWT-Cookie löschen
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    return res.status(200).json({ message: 'Abmeldung erfolgreich.', redirectTo: '/' });
};

// Token-Validierung (Wird vom API Gateway intern aufgerufen)
exports.validateToken = async (req, res) => {
    // JWT sollte bereits durch die Gateway-Middleware verifiziert sein.
    // Hier können wir einfach die im Token enthaltenen Benutzerinformationen zurückgeben.
    // req.user wird vom Gateway nach erfolgreicher Verifizierung gesetzt.
    if (!req.user || !req.user.id) {
        return res.status(401).json({ isValid: false, message: 'Token nicht validiert oder Benutzerdaten fehlen.' });
    }

    try {
        // Optional: Benutzer aus der DB abrufen, um sicherzustellen, dass er noch aktiv ist etc.
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'full_name', 'email', 'isActive'], // Nur benötigte Felder
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ isValid: false, message: 'Benutzer inaktiv oder nicht gefunden.' });
        }

        return res.status(200).json({
            isValid: true,
            user: {
                id: user.id,
                username: user.full_name,
                email: user.email,
                roles: user.role ? [user.role.name] : [] // Sicherstellen, dass Rollen-Array zurückgegeben wird
            }
        });
    } catch (error) {
        console.error('Fehler bei der Token-Validierung im Auth Service:', error);
        res.status(500).json({ isValid: false, message: 'Interner Serverfehler bei der Token-Validierung.' });
    }
};

// Routen für die Benutzerverwaltung (werden vom API Gateway an diesen Service weitergeleitet)
// Dies sind die Endpunkte, die der user_management.ejs im Frontend ansprechen wird.

// Alle Benutzer abrufen
exports.getAllUsers = async (req, res) => {
    // Optional: Überprüfung der Rolle des anfragenden Benutzers aus X-User-Roles-Header
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer abzurufen.' });
    }

    try {
        const users = await User.findAll({
            attributes: ['id', 'full_name', 'pin', 'isActive'],
            include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            full_name: user.full_name,
            pin: user.pin,
            role_id: user.role.id,
            role_name: user.role.name,
            isActive: user.isActive
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
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzerdetails abzurufen.' });
    }

    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'full_name', 'pin', 'role_id', 'isActive'],
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }
        res.status(200).json({
            id: user.id,
            full_name: user.full_name,
            pin: user.pin,
            role_id: user.role_id,
            role_name: user.role.name,
            isActive: user.isActive
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Benutzer aktualisieren
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, role_id, isActive } = req.body; // Passwort wird separat aktualisiert
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.includes('Manager')) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer zu aktualisieren.' });
    }

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
        }

        user.full_name = full_name !== undefined ? full_name : user.full_name;
        user.role_id = role_id !== undefined ? role_id : user.role_id;
        user.isActive = isActive !== undefined ? isActive : user.isActive;
        await user.save();

        res.status(200).json({ message: 'Benutzer erfolgreich aktualisiert.' });
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
        await user.destroy();
        res.status(200).json({ message: 'Benutzer erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};

// Alle Rollen abrufen
exports.getAllRoles = async (req, res) => {
    // Jeder authentifizierte Benutzer kann Rollen abrufen, um z.B. Dropdowns zu füllen.
    // Wenn nur Manager Rollen sehen sollen, hier prüfen:
    // const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    // if (!userRoles.includes('Manager')) { return res.status(403).json({ message: 'Keine Berechtigung.' }); }

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
    // Optional: Autorisierung, z.B. nur Disponenten/Manager dürfen diese Liste sehen
    const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
    if (!userRoles.some(role => ['Manager', 'Admin', 'Disponent', 'Monteur'].includes(role))) {
        return res.status(403).json({ message: 'Keine Berechtigung, Benutzer für Zuweisung abzurufen.' });
    }

    try {
        const users = await User.findAll({
            where: { isActive: true }, // Nur aktive Benutzer
            attributes: ['id', 'full_name', 'pin'],
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            full_name: user.full_name,
            pin: user.pin,
            role_name: user.role ? user.role.name : 'N/A'
        }));

        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer für Zuweisung:', error);
        res.status(500).json({ message: 'Interner Serverfehler.' });
    }
};
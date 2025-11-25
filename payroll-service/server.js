// DRP2/payroll-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const payrollRoutes = require('./routes/payrollRoutes');
const defineModels = require('./models/payrollModel'); // Importiere die defineModels Funktion
const sequelize = require('./config/sequelize'); // Importiere die zentrale Sequelize-Instanz
const { DataTypes } = require('sequelize'); // DataTypes separat importieren
const payrollController = require('./controllers/payrollController'); // Controller importieren
const path = require('path'); // NEU HINZUGEFÜGT für Dateipfade


dotenv.config();

const app = express();
app.use(express.json());

// Modelle initialisieren und Beziehungen herstellen
// Rufe die defineModels Funktion auf, um die Modelle zu registrieren.
// Die Modelle werden dadurch in sequelize.models verfügbar.
const { PayrollRun, Payslip } = defineModels(sequelize, DataTypes); // Rückgabe der Modelle

// WICHTIG: Übergebe die initialisierten Modelle an den Controller
payrollController.init(PayrollRun, Payslip);


// Authentifizierungs-Middleware (vereinfacht)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.warn("[Payroll Service] Authentifizierung: Kein Token gefunden.");
        return res.sendStatus(401); // Unauthorized
    }

    console.log("[Payroll Service] Token vorhanden (Vereinfachte Prüfung - kein JWT Verify)");
    req.user = { id: 'mockUserId', role: 'Admin', jwtToken: token }; // Mock-User-Daten
    next();
};

app.use(authenticateToken);

// Statische Dateien für generierte PDFs servieren
// Der 'uploads' Ordner wird vom Controller erstellt und befüllt.
// Dieser Endpunkt macht die PDFs unter /uploads/[dateiname.pdf] zugänglich.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routen für den Payroll Service
app.use('/api/payroll', payrollRoutes);

// Globaler Fehler-Handler
app.use((err, req, res, next) => {
    console.error(`[Payroll Service] Globaler Fehler: ${err.stack}`);
    res.status(500).send('Ein interner Serverfehler ist aufgetreten!');
});

const PORT = process.env.PORT || 3009;

// Datenbank synchronisieren und Server starten
sequelize.sync({ alter: true })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Payroll Service: Erfolgreich mit der MySQL-Datenbank verbunden (Sequelize)!`);
            console.log(`Payroll Service läuft auf Port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Payroll Service: Fehler beim Starten des Servers aufgrund von DB-Verbindungsfehler oder Synchronisationsfehler:', err.message);
        process.exit(1);
    });
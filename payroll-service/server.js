const express = require('express');
const dotenv = require('dotenv');
const payrollRoutes = require('./routes/payrollRoutes');
const { initModels } = require('./models/payrollModel');
const sequelize = require('./config/sequelize'); // Importiere die zentrale Sequelize-Instanz

dotenv.config();

const app = express();
app.use(express.json());

// Modelle initialisieren und Beziehungen herstellen
const { DataTypes } = require('sequelize');
initModels(sequelize, DataTypes);

// Authentifizierungs-Middleware (vereinfacht)
// In einer echten Anwendung würde dies über ein zentrales API Gateway oder
// eine JWT-Validierung erfolgen, die von einem Auth Service bereitgestellt wird.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // Kein Token

    // Hier würde eine echte Token-Validierung erfolgen (z.B. mit dem Auth Service)
    // Für diesen Entwurf gehen wir davon aus, dass ein Token vorhanden ist.
    // Ein echter Microservice würde das Token an den Auth Service zur Validierung senden.
    console.log("[Payroll Service] Token vorhanden (Vereinfachte Prüfung)");
    req.user = { id: 'mockUserId', role: 'Admin' }; // Mock-Benutzer für den Entwurf
    next();
};

app.use(authenticateToken);

// Routen
app.use('/api/payroll', payrollRoutes);

// Fehlerbehandlungs-Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3009; // Standard-Port für den Payroll Service

// Sequelize synchronisieren und Server starten
sequelize.sync({ alter: true }) // ACHTUNG: alter: true ist für die Entwicklung nützlich,
                              // aber in Produktion sollte man Migrations-Tools verwenden.
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

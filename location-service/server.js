const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const locationRoutes = require('./routes/locationRoutes');
const sequelize = require('./config/sequelize');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

console.log('Starte Location Service...');
console.log(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
console.log(`Service-Port: ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log-Middleware für eingehende Anfragen
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url} von ${req.ip}`);
    next();
});

// Routen
app.use('/api/locations', locationRoutes);
console.log('Location Routen unter /api/locations geladen.');

// Health Check Endpoint
app.get('/health', async (req, res) => {
    console.log('[Health Check] Anfrage erhalten.');
    try {
        await sequelize.authenticate();
        console.log('[Health Check] Datenbankverbindung erfolgreich.');
        res.status(200).json({ message: 'Location Service is healthy', database: 'connected' });
    } catch (error) {
        console.error('[Health Check] Health check fehlgeschlagen:', error);
        res.status(500).json({ message: 'Location Service is unhealthy', database: 'disconnected', error: error.message });
    }
});

// Fehlerbehandlungs-Middleware
app.use((err, req, res, next) => {
    console.error('[Unhandled Error] Ein unerwarteter Fehler ist aufgetreten:', err.stack);
    res.status(500).json({ message: 'Ein unerwarteter Serverfehler ist aufgetreten.' });
});

// Sequelize synchronisieren und Server starten
sequelize.sync({ alter: false })
    .then(() => {
        console.log('Sequelize: Datenbank synchronisiert.');
        app.listen(PORT, () => {
            console.log(`Location Service läuft auf Port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Sequelize: Datenbankverbindung fehlgeschlagen:', err);
        process.exit(1);
    });

module.exports = app;
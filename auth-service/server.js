require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { sequelize } = require('./config/sequelize'); // Sequelize-Instanz initialisieren und DB verbinden

const app = express();
const port = process.env.PORT || 3001; // Spezifischer Port für diesen Service

// --------------------------------------------------------------------------
// Middleware für den Auth Service
// --------------------------------------------------------------------------
app.use(cors({
    origin: '*', // Erlaube alle Ursprünge (anpassbar für Produktion)
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// --------------------------------------------------------------------------
// Routen des Auth Service
// --------------------------------------------------------------------------
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes); // Alle Auth-Routen unter dem Root-Pfad


// --------------------------------------------------------------------------
// Health Check Route
// --------------------------------------------------------------------------
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate(); // Prüft die DB-Verbindung
        res.status(200).json({ status: 'Auth Service ist gesund', database: 'OK' });
    } catch (error) {
        console.error('Auth Service Health Check Fehler:', error);
        res.status(500).json({ status: 'Auth Service fehlerhaft', database: 'ERROR', message: error.message });
    }
});


// --------------------------------------------------------------------------
// Fehlerbehandlung und Server-Start
// --------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('Auth Service Fehler:', err.stack);
    res.status(500).json({ message: 'Auth Service: Ein interner Fehler ist aufgetreten!' });
});

// Startet den Server, nachdem die Sequelize-Verbindung geprüft wurde
sequelize.authenticate()
    .then(() => {
        app.listen(port, () => {
            console.log(`Auth Service läuft auf Port ${port}`);
            console.log(`Auth Service ist intern erreichbar auf http://auth-service:${port}`);
        });
    })
    .catch(err => {
        console.error('Auth Service: Fehler beim Starten des Servers aufgrund von DB-Verbindungsfehler:', err.message);
        process.exit(1); // Anwendung beenden, wenn keine DB-Verbindung besteht
    });
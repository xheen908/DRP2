require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./config/sequelize'); // Sequelize-Instanz initialisieren und DB verbinden

const app = express();
const port = process.env.PORT || 3002; // Spezifischer Port für diesen Service

// --------------------------------------------------------------------------
// Middleware für den Job Service
// --------------------------------------------------------------------------
app.use(cors({
    origin: '*', // Erlaube alle Ursprünge (anpassbar für Produktion)
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --------------------------------------------------------------------------
// Routen des Job Service
// --------------------------------------------------------------------------
const jobRoutes = require('./routes/jobRoutes');
app.use('/', jobRoutes); // Alle Job-Routen unter dem Root-Pfad


// --------------------------------------------------------------------------
// Health Check Route
// --------------------------------------------------------------------------
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate(); // Prüft die DB-Verbindung
        res.status(200).json({ status: 'Job Service ist gesund', database: 'OK' });
    } catch (error) {
        console.error('Job Service Health Check Fehler:', error);
        res.status(500).json({ status: 'Job Service fehlerhaft', database: 'ERROR', message: error.message });
    }
});


// --------------------------------------------------------------------------
// Fehlerbehandlung und Server-Start
// --------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('Job Service Fehler:', err.stack);
    res.status(500).json({ message: 'Job Service: Ein interner Fehler ist aufgetreten!' });
});

// Startet den Server, nachdem die Sequelize-Verbindung geprüft wurde
sequelize.authenticate()
    .then(() => {
        app.listen(port, () => {
            console.log(`Job Service läuft auf Port ${port}`);
            console.log(`Job Service ist intern erreichbar auf http://job-service:${port}`);
        });
    })
    .catch(err => {
        console.error('Job Service: Fehler beim Starten des Servers aufgrund von DB-Verbindungsfehler:', err.message);
        process.exit(1);
    });
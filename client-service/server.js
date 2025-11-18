require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./config/sequelize'); // Sequelize-Instanz initialisieren und DB verbinden

const app = express();
const port = process.env.PORT || 3006; // Spezifischer Port für diesen Service

// --------------------------------------------------------------------------
// Middleware für den Client Service
// --------------------------------------------------------------------------
app.use(cors({
    origin: '*', // Erlaube alle Ursprünge (anpassbar für Produktion)
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --------------------------------------------------------------------------
// Routen des Client Service
// --------------------------------------------------------------------------
const clientRoutes = require('./routes/clientRoutes');
app.use('/', clientRoutes); // Alle Client-Routen unter dem Root-Pfad


// --------------------------------------------------------------------------
// Health Check Route
// --------------------------------------------------------------------------
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate(); // Prüft die DB-Verbindung
        res.status(200).json({ status: 'Client Service ist gesund', database: 'OK' });
    } catch (error) {
        console.error('Client Service Health Check Fehler:', error);
        res.status(500).json({ status: 'Client Service fehlerhaft', database: 'ERROR', message: error.message });
    }
});


// --------------------------------------------------------------------------
// Fehlerbehandlung und Server-Start
// --------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('Client Service Fehler:', err.stack);
    res.status(500).json({ message: 'Client Service: Ein interner Fehler ist aufgetreten!' });
});

// Startet den Server, nachdem die Sequelize-Verbindung geprüft wurde
sequelize.authenticate()
    .then(() => {
        app.listen(port, () => {
            console.log(`Client Service läuft auf Port ${port}`);
            console.log(`Client Service ist intern erreichbar auf http://client-service:${port}`);
        });
    })
    .catch(err => {
        console.error('Client Service: Fehler beim Starten des Servers aufgrund von DB-Verbindungsfehler:', err.message);
        process.exit(1);
    });
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3010;

// Multer storage configuration
// Store files temporarily on disk before processing with rclone
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ANPASSUNG HIER: KEINE WEITERE MODIFIKATION DES DATEINAMENS DURCH MULTER
    // Der aufrufende Service (payroll-service) ist nun für die Pfad- und Namensgebung verantwortlich.
    // Wir nehmen file.originalname direkt, welches den vollständigen Pfad im Bucket enthält.
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Rclone configuration from environment variables for Docker
const RCLONE_REMOTE_NAME = process.env.RCLONE_REMOTE_NAME;
const RCLONE_BUCKET_NAME = process.env.RCLONE_BUCKET_NAME;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
// Basis-URL für das API Gateway, um Links zu generieren
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3005';


if (!RCLONE_BUCKET_NAME || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_ENDPOINT) {
  console.error('Alle notwendigen S3-Umgebungsvariablen (RCLONE_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT) müssen gesetzt sein.');
  process.exit(1);
}

// rclonePath verwendet '::s3:' Präfix für unbenannte S3-Konfiguration über Flags
const rclonePath = `:s3:${RCLONE_BUCKET_NAME}`;

// Basisargumente für rclone, die S3-Konfiguration übergeben
const rcloneBaseArgs = [
  '--config', '/dev/null', // Wichtig: Weist rclone an, KEINE Konfigurationsdatei zu verwenden
  '--s3-access-key-id', S3_ACCESS_KEY_ID,
  '--s3-secret-access-key', S3_SECRET_ACCESS_KEY,
  '--s3-endpoint', S3_ENDPOINT,
  '--s3-provider', 'Cloudflare', // Beibehalten, da es spezifischer für R2 ist
  '--s3-no-check-bucket' // Verhindert, dass rclone die Existenz des Buckets überprüft oder versucht, es zu erstellen.
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware zum Parsen der X-User-ID und X-User-Roles Header
const extractUserAndRoles = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRolesHeader = req.headers['x-user-roles'];

  if (userId) {
    req.user = { id: userId };
    if (userRolesHeader) {
      req.user.roles = userRolesHeader.split(',').map(role => role.trim());
    } else {
      req.user.roles = [];
    }
    console.log(`[File Storage Service] Authentifizierter Benutzer: ID=${req.user.id}, Rollen=${req.user.roles.join(', ')}`);
  } else {
    req.user = null; // Nicht authentifiziert oder Token ungültig
    console.log('[File Storage Service] Nicht authentifizierte Anfrage.');
  }
  next();
};

app.use(extractUserAndRoles);

// Autorisierungs-Middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).send('Nicht authentifiziert. Bitte melden Sie sich an.');
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      // Wenn keine spezifischen Rollen erforderlich sind, ist jeder authentifizierte Benutzer berechtigt
      return next();
    }

    const hasPermission = allowedRoles.some(role => req.user.roles.includes(role));
    if (hasPermission) {
      next();
    } else {
      res.status(403).send('Keine Berechtigung für diese Aktion.');
    }
  };
};

// Routen

// Dateiupload (erfordert 'admin' oder 'Manager' Rolle)
app.post('/upload/:targetFolder(*)', authorize(['admin', 'Manager']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }

  const localFilePath = req.file.path;
  const originalFileName = req.file.originalname; // Das ist der Originalname, wie vom Client gesendet

  // Extrahiere den dynamischen Ordnernamen aus den URL-Parametern
  let dynamicTargetPath = req.params.targetFolder || ''; // Z.B. "payslips/Nov2025"

  // Sicherstellen, dass der dynamicTargetPath nicht mit dem Bucket-Namen beginnt,
  // da der Bucket-Namen bereits im rclonePath enthalten ist.
  // Dies verhindert eine doppelte Pfadangabe im Bucket.
  if (RCLONE_BUCKET_NAME && dynamicTargetPath.startsWith(RCLONE_BUCKET_NAME + '/')) {
    dynamicTargetPath = dynamicTargetPath.substring(RCLONE_BUCKET_NAME.length + 1);
    console.log(`[File Storage Service Debug] Entfernte doppelten Bucket-Namen aus targetFolder. Neuer dynamicTargetPath: ${dynamicTargetPath}`);
  }


  // Kombiniere dynamischen Pfad und Dateinamen
  // Der originalFileName sollte jetzt nur der Dateiname ohne Pfad sein,
  // da payroll-service so angepasst wurde.
  const remoteFileName = dynamicTargetPath ? `${dynamicTargetPath}/${originalFileName}` : originalFileName;

  console.log(`[File Storage Service Debug] Erhaltener originalname von Multer: ${req.file.originalname}`);
  console.log(`[File Storage Service Debug] Endgültiger Dateiname für Remote (remoteFileName): ${remoteFileName}`);
  console.log(`[File Storage Service Debug] Rclone Bucket Pfad: ${rclonePath}`);

  // Der Zielpfad für rclone muss den Bucket-Namen und den vollständigen Remote-Dateinamen enthalten
  const targetPathForRclone = `${rclonePath}/${remoteFileName}`;
  console.log(`[File Storage Service Debug] Vollständiger Zielpfad für rclone: ${targetPathForRclone}`);

  const rcloneArgs = [
    ...rcloneBaseArgs,
    'copyto',
    localFilePath,
    targetPathForRclone // <-- Verwenden Sie die explizit gebaute Variable
  ];

  console.log(`[File Storage Service Debug] Rclone Befehl Argumente: rclone ${rcloneArgs.join(' ')}`);
  // --- ENDE Debug-Logging ---

  const rcloneCommand = spawn('rclone', rcloneArgs);

  rcloneCommand.stdout.on('data', (data) => {
    console.log(`rclone stdout: ${data}`);
  });

  rcloneCommand.stderr.on('data', (data) => {
    console.error(`rclone stderr: ${data}`);
  });

  rcloneCommand.on('close', (code) => {
    // Clean up local temporary file
    fs.unlink(localFilePath, (err) => {
      if (err) console.error('Fehler beim Löschen der lokalen Datei:', err);
    });

    if (code === 0) {
      // Generiere den direkten S3-Link und den Gateway-Link
      const s3DirectLink = `${S3_ENDPOINT}/${RCLONE_BUCKET_NAME}/${remoteFileName}`;
      const apiGatewayDownloadLink = `${API_GATEWAY_URL}/api/files/download/${remoteFileName}`;

      res.status(200).json({
        message: `Datei ${remoteFileName} erfolgreich hochgeladen.`,
        fileName: remoteFileName,
        s3DirectLink: s3DirectLink,
        apiGatewayDownloadLink: apiGatewayDownloadLink
      });
    } else {
      res.status(500).send(`Fehler beim Hochladen der Datei mit rclone. Exit Code: ${code}`);
    }
  });
});

// Datei herunterladen (erfordert Authentifizierung, keine spezifische Rolle)
// ANPASSUNG: Wildcard (*) hinzugefügt, um den gesamten Pfad im Dateinamen zu erfassen
app.get('/download/:filename(*)', authorize([]), (req, res) => { // Leeres Array bedeutet: nur authentifiziert
  const remoteFileName = req.params.filename; // filename kann hier auch einen Pfad enthalten, z.B. "folder/file.pdf"
  // localDownloadPath sollte nur der Dateiname sein, da wir ihn in einem lokalen Ordner speichern
  const localFileName = path.basename(remoteFileName);
  const localDownloadPath = path.join('./downloads', localFileName);

  // Sicherstellen, dass das Download-Verzeichnis existiert
  if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
  }

  const rcloneArgs = [
    ...rcloneBaseArgs,
    'copyto',
    `${rclonePath}/${remoteFileName}`, // remoteFileName sollte den vollständigen Pfad im Bucket enthalten
    localDownloadPath
  ];

  console.log(`[File Storage Service Debug] Download - Rclone Befehl Argumente: rclone ${rcloneArgs.join(' ')}`);

  const rcloneCommand = spawn('rclone', rcloneArgs);

  rcloneCommand.stdout.on('data', (data) => {
    console.log(`rclone download stdout: ${data}`);
  });

  rcloneCommand.stderr.on('data', (data) => {
    console.error(`rclone download stderr: ${data}`);
  });

  rcloneCommand.on('close', (code) => {
    if (code === 0) {
      // Senden der heruntergeladenen Datei
      // Der Callback von res.download wird aufgerufen, wenn der Download abgeschlossen ist
      res.download(localDownloadPath, localFileName, (err) => { // localFileName als optionaler Dateiname für den Client
        if (err) {
          console.error('Fehler beim Senden der Datei:', err);
          res.status(500).send('Fehler beim Herunterladen der Datei.');
        } else {
          console.log(`Datei ${localFileName} erfolgreich an Client gesendet.`);
        }
        // Lokale temporäre Datei nach dem Senden löschen
        fs.unlink(localDownloadPath, (unlinkErr) => {
          if (unlinkErr) console.error('Fehler beim Löschen der lokalen Download-Datei:', unlinkErr);
          else console.log(`Lokale Datei ${localDownloadPath} erfolgreich gelöscht.`);
        });
      });
    } else {
      // Wenn rclone einen Fehler zurückgibt, löschen wir die (möglicherweise unvollständige) lokale Datei und senden einen Fehler.
      fs.unlink(localDownloadPath, (unlinkErr) => {
        if (unlinkErr) console.error('Fehler beim Löschen der lokalen Datei nach rclone Fehler:', unlinkErr);
      });
      res.status(500).send(`Fehler beim Herunterladen der Datei mit rclone. Exit Code: ${code}`);
    }
  });
});

// Datei löschen (erfordert 'admin' Rolle)
app.delete('/delete/:filename', authorize(['admin']), (req, res) => {
  const remoteFileName = req.params.filename; // filename kann hier auch einen Pfad enthalten

  const rcloneArgs = [
    ...rcloneBaseArgs,
    'delete',
    `${rclonePath}/${remoteFileName}`
  ];

  const rcloneCommand = spawn('rclone', rcloneArgs);

  rcloneCommand.stdout.on('data', (data) => {
    console.log(`rclone stdout: ${data}`);
  });

  rcloneCommand.stderr.on('data', (data) => {
    console.error(`rclone stderr: ${data}`);
  });

  rcloneCommand.on('close', (code) => {
    if (code === 0) {
      res.status(200).send(`Datei ${remoteFileName} erfolgreich gelöscht.`);
    } else {
      res.status(500).send(`Fehler beim Löschen der Datei mit rclone. Exit Code: ${code}`);
    }
  });
});


// Server starten
app.listen(port, () => {
  console.log(`File Storage Service läuft auf Port ${port}`);
});
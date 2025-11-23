-- Globales Initialisierungsskript für alle Microservice-Datenbanken

-- --------------------------------------------------------------------------
-- Auth Service Datenbank (auth_db)
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;

-- Tabelle: roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'Name der Rolle (z.B. Admin, Manager, Disponent, Monteur)',
  description VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  is_time_tracker_required TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Muss Arbeitszeit tracken, 0=Management-Pfad (kein Tracking)',
  can_manage_users TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=Darf Benutzer und Rollen verwalten'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Definiert die Systemrollen und deren Workflow-Pfad';

-- Initialdaten für roles
INSERT IGNORE INTO roles (id, name, description, is_time_tracker_required, can_manage_users) VALUES
  (1, 'Admin', 'Volle administrative Kontrolle.', 0, 1),
  (2, 'Manager', 'Manager-Rolle mit vollem Zugriff auf operative Funktionen.', 0, 1),
  (3, 'Disponent', 'Auftragsverwaltung und Zuweisung.', 0, 0),
  (4, 'Monteur', 'Führt Jobs aus und erfasst Arbeitszeiten.', 1, 0);

-- Tabelle: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL COMMENT 'FK: Zugehörige Rolle (definiert den Workflow)',
  full_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Vollständiger Name des Benutzers',
  pin VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'Eindeutige PIN für den Badge/PIN-Login',
  password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  external_auth_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL UNIQUE COMMENT 'Optional: Firebase UID oder externes SSO ID',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Status des Benutzers',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet alle Benutzer des Systems (Worker, Manager, Disponenten)';

-- Initialdaten für users
INSERT IGNORE INTO users (id, role_id, full_name, pin, password, external_auth_id, is_active, createdAt, updatedAt) VALUES
  (1006, 2, 'Sarah Manager', '3333333333', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', NULL, 1, '2025-11-12 01:12:27', '2025-11-12 01:12:27'),
  (1009, 3, 'Dieter Disponent', '8467631315', '$2b$10$yun.AK/r4YHgEuAaM/vXaOxZDKhY1KWTDWbkU.tBsOp5SXMxw92sy', NULL, 1, '2025-11-12 01:13:55', '2025-11-12 01:13:55'),
  (1015, 4, 'Ronny Weber', '3157769787', '$2b$10$fhTPAIZQ0sgGmWi/ZCV0ZOus9tcAkIkVrZIvY4OyHJkEHdMR75lMy', NULL, 1, '2025-11-12 23:56:30', '2025-11-12 23:56:30');


-- --------------------------------------------------------------------------
-- Client Service Datenbank (client_db)
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS client_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE client_db;

-- Tabelle: clients
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'Name des Kunden / der Firma',
  contact_person VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ansprechpartner beim Kunden',
  email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  phone VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hauptadresse des Kunden',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet die Kundendaten';

-- Initialdaten für clients
INSERT IGNORE INTO clients (id, name, contact_person, email, phone, address, createdAt, updatedAt) VALUES
  (1, 'DRP Interne Verwaltung', 'Geschäftsführung', 'info@drp.de', '+49 123 456789', 'Albertstr 7, 47059 Duisburg', '2025-11-13 20:54:03', '2025-11-13 21:01:26'),
  (3, 'Solar Solution GmbH', 'Anna Schmidt', 'anna.schmidt@solar-solutions.de', '+49 987 654321', 'Am Förderturm 10, 47198 Duisburg', '2025-11-12 15:00:35', '2025-11-16 12:22:00');


-- --------------------------------------------------------------------------
-- Location Service Datenbank (location_db)
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS location_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE location_db;

-- Tabelle: locations
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL COMMENT 'Zugehöriger Kunde (logische Verknüpfung zum Client Service)',
  name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name des Einsatzortes (z.B. Treppenhaus B, Gebäude C)',
  address VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  latitude DECIMAL(10,8) DEFAULT NULL,
  longitude DECIMAL(11,8) DEFAULT NULL,
  nfc_tag_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT 'Eindeutige ID des NFC-Tags am Einsatzort',
  contact_person VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  type VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer_location'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet Einsatzorte mit GPS und NFC-Tag-IDs';

-- Initialdaten für locations
INSERT IGNORE INTO locations (id, client_id, name, address, latitude, longitude, nfc_tag_id, contact_person, createdAt, updatedAt, type) VALUES
  (1, 1, 'DRP Verwaltung', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-001', 'Herr Schmidt', '2025-11-13 21:00:52', '2025-11-15 18:20:13', 'company_location'),
  (8, 1, 'Verwaltung Büro 2', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-003', 'Frau Huber', '2025-11-12 15:11:45', '2025-11-15 18:30:17', 'customer_location'),
  (12, 1, 'Verwaltung Büro 1', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-002', 'Herr Schmidt', '2025-11-15 18:14:31', '2025-11-15 18:20:06', 'customer_location'),
  (13, 3, 'Solar Park 1 / Solar Panel 1&2', 'Schifferstr. 10-16, 47059 Duisburg', 51.43544960, 6.75440950, 'NFC-LOC-023', 'Herr Schmidt', '2025-11-16 12:14:23', '2025-11-16 12:16:59', 'customer_location');


-- --------------------------------------------------------------------------
-- Job Service Datenbank (job_db)
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS job_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_db;

-- Tabelle: jobs
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_number VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kurze Beschreibung des Auftrags',
  description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Detaillierte Beschreibung des Auftrags',
  location_id INT NOT NULL COMMENT 'Einsatzort des Auftrags (logische Verknüpfung zum Location Service)',
  status ENUM('Offen','In Bearbeitung','Abgeschlossen','Abgebrochen') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Offen',
  assigned_user_id INT DEFAULT NULL COMMENT 'Benutzer, dem der Auftrag zugewiesen ist (logische Verknüpfung zum Auth Service)',
  planned_start DATETIME DEFAULT NULL COMMENT 'Geplante Startzeit',
  planned_end DATETIME DEFAULT NULL COMMENT 'Geplantes Ende',
  actual_start_time DATETIME DEFAULT NULL COMMENT 'Tatsächliche Startzeit durch Mitarbeiter',
  actual_end_time DATETIME DEFAULT NULL COMMENT 'Tatsächliche Endzeit durch Mitarbeiter',
  before_photo_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL zum Vorher-Foto',
  after_photo_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL zum Nachher-Foto',
  check_in_latitude DECIMAL(10,7) DEFAULT NULL,
  check_in_longitude DECIMAL(10,7) DEFAULT NULL,
  check_out_latitude DECIMAL(10,7) DEFAULT NULL,
  check_out_longitude DECIMAL(10,7) DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet die aktiven Aufträge';

-- Initialdaten für jobs
INSERT IGNORE INTO jobs (id, job_number, title, description, location_id, status, assigned_user_id, planned_start, planned_end, actual_start_time, actual_end_time, before_photo_url, after_photo_url, createdAt, updatedAt, check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude) VALUES
  (2010, 'DRP2025-001', 'Reinigung', 'Solar Panel 1', 8, 'Offen', 1015, '2025-11-20 06:00:00', '2025-11-20 14:00:00', NULL, NULL, NULL, NULL, '2025-11-15 17:07:19', '2025-11-16 11:58:39', NULL, NULL, NULL, NULL),
  (2011, 'DRP2025-002', 'Reinigung', 'Büro 1', 12, 'Offen', 1015, '2025-11-21 06:00:00', '2025-11-15 14:00:00', NULL, NULL, NULL, NULL, '2025-11-15 18:15:26', '2025-11-16 11:59:12', NULL, NULL, NULL, NULL),
  (2012, 'DRP2025-003', 'Reinigung', 'Büro 2', 12, 'Offen', 1015, '2025-11-19 06:00:00', '2025-11-19 14:00:00', NULL, NULL, NULL, NULL, '2025-11-15 18:31:56', '2025-11-16 12:01:20', NULL, NULL, NULL, NULL),
  (2013, 'DRP2025-004', 'Reinigung', 'Büro 1', 8, 'Offen', 1015, '2025-11-18 06:00:00', '2025-11-18 14:00:00', NULL, NULL, NULL, NULL, '2025-11-15 19:17:23', '2025-11-17 00:19:04', NULL, NULL, NULL, NULL),
  (2014, 'DRP2025-005', 'Reinigung', 'Solar Panel 1', 12, 'Offen', 1015, '2025-11-17 06:00:00', '2025-11-17 14:00:00', NULL, NULL, NULL, NULL, '2025-11-15 21:46:06', '2025-11-17 00:18:54', NULL, NULL, NULL, NULL),
  (2015, 'DRP2025-006', 'Reinigung', 'Büro 2', 8, 'Abgeschlossen', 1015, '2025-11-14 14:00:00', '2025-11-14 22:00:00', '2025-11-16 12:11:06', '2025-11-16 12:11:36', NULL, NULL, '2025-11-15 21:47:04', '2025-11-16 12:11:36', 51.4421993, 6.7478753, 51.4421993, 6.7478753);


-- --------------------------------------------------------------------------
-- Shift Service Datenbank (shift_db)
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS shift_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shift_db;

-- Tabelle: shifts
CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'Zugehöriger Benutzer (logische Verknüpfung zum Auth Service)',
  job_id INT DEFAULT NULL COMMENT 'Optional: Verweis auf den Job Service',
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('Geplant','Bestätigt','Abgeschlossen','Abgebrochen') DEFAULT 'Geplant',
  notes TEXT DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialdaten für shifts (angepasst an neue Spaltennamen)
INSERT IGNORE INTO shifts (id, user_id, start_time, end_time, status, notes, createdAt, updatedAt) VALUES
  (6, 1015, '2025-11-14 03:48:48', '2025-11-14 08:27:57', 'Abgeschlossen', NULL, '2025-11-14 02:48:47', '2025-11-14 07:27:57'),
  (9, 1015, '2025-11-14 20:29:25', '2025-11-14 23:16:26', 'Abgeschlossen', NULL, '2025-11-14 19:29:24', '2025-11-14 22:16:25'),
  (10, 1015, '2025-11-15 13:52:26', '2025-11-15 17:13:29', 'Abgeschlossen', NULL, '2025-11-15 12:52:24', '2025-11-15 16:13:28'),
  (11, 1015, '2025-11-15 17:14:29', '2025-11-15 19:26:32', 'Abgeschlossen', NULL, '2025-11-15 16:14:28', '2025-11-15 18:26:32'),
  (12, 1015, '2025-11-15 19:32:37', '2025-11-15 20:45:10', 'Abgeschlossen', NULL, '2025-11-15 18:32:37', '2025-11-15 19:45:09'),
  (13, 1015, '2025-11-15 21:28:16', '2025-11-15 23:35:46', 'Abgeschlossen', NULL, '2025-11-15 20:28:15', '2025-11-15 22:35:45'),
  (14, 1015, '2025-11-16 02:34:31', '2025-11-16 02:36:20', 'Abgeschlossen', NULL, '2025-11-16 01:34:30', '2025-11-16 01:36:18'),
  (15, 1015, '2025-11-16 12:39:19', '2025-11-16 13:36:35', 'Abgeschlossen', NULL, '2025-11-16 11:39:19', '2025-11-16 12:36:35'),
  (16, 1015, '2025-11-17 01:10:38', '2025-11-17 10:50:01', 'Abgeschlossen', NULL, '2025-11-17 00:10:37', '2025-11-17 09:50:01');

-- Tabelle: shift_logs
CREATE TABLE IF NOT EXISTS shift_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL COMMENT 'Zugehörige Schicht (logische Verknüpfung innerhalb des Shift Service)',
  job_id INT DEFAULT NULL COMMENT 'Zugehöriger Job (logische Verknüpfung zum Job Service)',
  timestamp DATETIME NOT NULL,
  log_type ENUM('CHECKIN','CHECKOUT','START_JOB','END_JOB','GPS_UPDATE','PHOTO_PROOF','NOTE','CHECKLIST') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  gps_latitude DECIMAL(10,8) DEFAULT NULL,
  gps_longitude DECIMAL(11,8) DEFAULT NULL,
  photo_data MEDIUMBLOB DEFAULT NULL,
  checklist_data JSON DEFAULT NULL,
  note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detaillierte Protokollierung aller Aktionen und Standortdaten';

-- Initialdaten für shift_logs (leer in der Original-DB)


-- --------------------------------------------------------------------------
-- HR Service Datenbank (hr_db) - NEU
-- --------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_db;

-- Tabelle: employees
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Logische Referenz zur ID des Benutzers im Auth Service (Auth Service hat eigene DB)',
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, 
    date_of_birth DATE, 
    date_of_hire DATE NOT NULL,
    department VARCHAR(255), 
    position VARCHAR(255), 
    salary DECIMAL(10, 2), 
    status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Benutzer und Berechtigungen (Zentral für alle DBs)
-- --------------------------------------------------------------------------
-- Benutzer 'drpuser'@'%' erstellen, falls er noch nicht existiert
CREATE USER IF NOT EXISTS 'drpuser'@'%' IDENTIFIED BY 'drppassword';

-- Berechtigungen für jede Datenbank zuweisen
GRANT ALL PRIVILEGES ON auth_db.* TO 'drpuser'@'%';
GRANT ALL PRIVILEGES ON client_db.* TO 'drpuser'@'%';
GRANT ALL PRIVILEGES ON location_db.* TO 'drpuser'@'%';
GRANT ALL PRIVILEGES ON job_db.* TO 'drpuser'@'%';
GRANT ALL PRIVILEGES ON shift_db.* TO 'drpuser'@'%';
GRANT ALL PRIVILEGES ON hr_db.* TO 'drpuser'@'%'; -- <-- NEU: Berechtigungen für hr_db hinzufügen

FLUSH PRIVILEGES;
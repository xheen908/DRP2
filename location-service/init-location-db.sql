-- Erstelle die Datenbank, falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS location_db;

-- Wähle die Datenbank aus
USE location_db;

-- Tabelle für Standorte
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    nfc_tag_id VARCHAR(255) UNIQUE,
    client_id INT, -- Referenz zur Client-ID (wird vom Client-Service validiert)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Füge Beispieldaten ein (optional)
INSERT INTO locations (name, address, latitude, longitude, nfc_tag_id, client_id) VALUES
('Hauptlager Berlin', 'Musterstraße 1, 10115 Berlin', 52.5200, 13.4050, 'NFC-BER-001', 1),
('Büro München', 'Beispielweg 10, 80331 München', 48.1351, 11.5820, 'NFC-MUC-002', 2),
('Werkstatt Hamburg', 'Hafenallee 5, 20457 Hamburg', 53.5488, 9.9872, 'NFC-HAM-003', 1);

-- Hinweis: Die client_id hier ist eine logische Referenz zu einem Client im Client-Service.
-- Es gibt keine direkte Foreign Key Constraint, da die Datenbanken isoliert sind.
-- Die Validierung der Existenz des Clients erfolgt auf Service-Ebene.
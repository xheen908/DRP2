-- DRP/drp2/client-service/init-client-db.sql
-- SQL-Befehle zur Initialisierung der 'client_db' für den Client Service.

-- Stellen Sie sicher, dass die Datenbank existiert und verwenden Sie diese
CREATE DATABASE IF NOT EXISTS client_db;
USE client_db;

-- Tabelle für Clients
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    address VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- HINWEIS: Sie können hier Beispiel-Clients einfügen
-- INSERT INTO clients (name, contact_person, email, phone, address) VALUES ('Alpha GmbH', 'Max Mustermann', 'max@alpha.de', '0123-456789', 'Musterstr. 1, 12345 Musterstadt');
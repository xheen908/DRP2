-- Erstelle die Datenbank, falls sie nicht existiert
CREATE DATABASE IF NOT EXISTS shift_db;

-- Wähle die Datenbank aus
USE shift_db;

-- Tabelle für Schichten
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Referenz zum Benutzer im Auth-Service
    job_id INT,           -- Optionale Referenz zum Job im Job-Service
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'PLANNED',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Füge Beispieldaten ein (optional)
INSERT INTO shifts (user_id, job_id, start_time, end_time, status, notes) VALUES
(1, 1, '2025-01-15 08:00:00', '2025-01-15 17:00:00', 'PLANNED', 'Tagesdienst für Job #1'),
(2, 2, '2025-01-15 09:00:00', '2025-01-15 18:00:00', 'PLANNED', 'Tagesdienst für Job #2'),
(1, NULL, '2025-01-16 08:00:00', '2025-01-16 12:00:00', 'PLANNED', 'Halbtagesdienst ohne spezifischen Job');

-- Hinweis: Die user_id und job_id hier sind logische Referenzen zu
-- Benutzern im Auth-Service bzw. Jobs im Job-Service.
-- Es gibt keine direkten Foreign Key Constraints, da die Datenbanken isoliert sind.
-- Die Validierung der Existenz erfolgt auf Service-Ebene.
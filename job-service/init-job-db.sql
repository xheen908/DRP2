-- DRP/drp2/job-service/init-job-db.sql
-- SQL-Befehle zur Initialisierung der 'job_db' für den Job Service.

-- Stellen Sie sicher, dass die Datenbank existiert und verwenden Sie diese
CREATE DATABASE IF NOT EXISTS job_db;
USE job_db;

-- Tabelle für Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_number VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT NOT NULL,       -- Referenz auf Client Service (ID in client_db)
    location_id INT NOT NULL,     -- Referenz auf Location Service (ID in location_db)
    assigned_user_id INT,         -- Referenz auf Auth Service (ID in auth_db)
    status ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD') NOT NULL DEFAULT 'PENDING',
    planned_start_time DATETIME,
    planned_end_time DATETIME,
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- HINWEIS: SQL FOREIGN KEYs über Datenbankgrenzen hinweg sind nicht direkt möglich.
-- Die referentielle Integrität für client_id, location_id und assigned_user_id
-- wird hier auf Anwendungsebene durch Aufrufe an die jeweiligen Microservices gehandhabt.

-- Beispiel-Job-Status hinzufügen (wenn Sie eine separate Statustabelle hätten, aber hier ENUM)
-- INSERT INTO job_statuses (name) VALUES ('PENDING');
-- ...
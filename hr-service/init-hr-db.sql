-- Datenbank hr_db erstellen, falls sie noch nicht existiert
CREATE DATABASE IF NOT EXISTS hr_db;

-- Benutzer 'drpuser'@'%' erstellen, falls er noch nicht existiert
-- (Das '%' bedeutet, dass sich der Benutzer von jedem Host aus verbinden kann.
-- Für Produktion sollte dies auf spezifische Hosts eingeschränkt werden.)
CREATE USER IF NOT EXISTS 'drpuser'@'%' IDENTIFIED BY 'drppassword';

-- Alle Berechtigungen auf der Datenbank hr_db für 'drpuser' gewähren
GRANT ALL PRIVILEGES ON hr_db.* TO 'drpuser'@'%';

-- Cache für Berechtigungen leeren
FLUSH PRIVILEGES;

-- Wechseln zur hr_db Datenbank
USE hr_db;

-- Tabelle 'employees' erstellen
-- Dies entspricht dem Sequelize-Modell in hrModel.js
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Logische Referenz zur ID des Benutzers im Auth Service (Auth Service hat eigene DB)',
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, -- allowNull: true, unique: true (optional)
    date_of_birth DATE, -- allowNull: true
    date_of_hire DATE NOT NULL,
    department VARCHAR(255), -- allowNull: true
    position VARCHAR(255), -- allowNull: true
    salary DECIMAL(10, 2), -- allowNull: true
    status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
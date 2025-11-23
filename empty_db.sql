-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server-Version:               8.0.43 - MySQL Community Server - GPL
-- Server-Betriebssystem:        Linux
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Exportiere Datenbank-Struktur für auth_db
CREATE DATABASE IF NOT EXISTS `auth_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `auth_db`;

-- Exportiere Struktur von Tabelle auth_db.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name der Rolle (z.B. Admin, Manager, Disponent, Monteur)',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_time_tracker_required` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=Muss Arbeitszeit tracken, 0=Management-Pfad (kein Tracking)',
  `can_manage_users` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=Darf Benutzer und Rollen verwalten',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Definiert die Systemrollen und deren Workflow-Pfad';

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle auth_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL COMMENT 'FK: ZugehÃ¶rige Rolle (definiert den Workflow)',
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'VollstÃ¤ndiger Name des Benutzers',
  `pin` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Eindeutige PIN fÃ¼r den Badge/PIN-Login',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_auth_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional: Firebase UID oder externes SSO ID',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Status des Benutzers',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pin` (`pin`),
  UNIQUE KEY `external_auth_id` (`external_auth_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet alle Benutzer des Systems (Worker, Manager, Disponenten)';

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für client_db
CREATE DATABASE IF NOT EXISTS `client_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `client_db`;

-- Exportiere Struktur von Tabelle client_db.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name des Kunden / der Firma',
  `contact_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ansprechpartner beim Kunden',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hauptadresse des Kunden',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet die Kundendaten';

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für hr_db
CREATE DATABASE IF NOT EXISTS `hr_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hr_db`;

-- Exportiere Struktur von Tabelle hr_db.emergency_contacts
CREATE TABLE IF NOT EXISTS `emergency_contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `relationship` varchar(100) DEFAULT NULL,
  `phone_number` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `emergency_contacts_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle hr_db.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'Logische Referenz zur ID des Benutzers im Auth Service (Auth Service hat eigene DB)',
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `marital_status` enum('Ledig','Verheiratet','Geschieden','Verwitwet','Eingetragene Partnerschaft','Unbekannt') DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `private_phone` varchar(50) DEFAULT NULL,
  `date_of_hire` date NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `work_location` varchar(255) DEFAULT NULL,
  `work_schedule_type` enum('Vollzeit','Teilzeit','Schichtarbeit','Gleitzeit','Minijob','Werkstudent','Praktikum','Ausbildung','Unbekannt') DEFAULT NULL,
  `annual_leave_entitlement` int DEFAULT '0',
  `salary` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','on_leave','terminated') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `user_id_2` (`user_id`),
  UNIQUE KEY `user_id_3` (`user_id`),
  UNIQUE KEY `user_id_4` (`user_id`),
  UNIQUE KEY `user_id_5` (`user_id`),
  UNIQUE KEY `user_id_6` (`user_id`),
  UNIQUE KEY `user_id_7` (`user_id`),
  UNIQUE KEY `user_id_8` (`user_id`),
  UNIQUE KEY `user_id_9` (`user_id`),
  UNIQUE KEY `user_id_10` (`user_id`),
  UNIQUE KEY `user_id_11` (`user_id`),
  UNIQUE KEY `user_id_12` (`user_id`),
  UNIQUE KEY `user_id_13` (`user_id`),
  UNIQUE KEY `user_id_14` (`user_id`),
  UNIQUE KEY `user_id_15` (`user_id`),
  UNIQUE KEY `user_id_16` (`user_id`),
  UNIQUE KEY `user_id_17` (`user_id`),
  UNIQUE KEY `user_id_18` (`user_id`),
  UNIQUE KEY `user_id_19` (`user_id`),
  UNIQUE KEY `user_id_20` (`user_id`),
  UNIQUE KEY `user_id_21` (`user_id`),
  UNIQUE KEY `user_id_22` (`user_id`),
  UNIQUE KEY `user_id_23` (`user_id`),
  UNIQUE KEY `user_id_24` (`user_id`),
  UNIQUE KEY `user_id_25` (`user_id`),
  UNIQUE KEY `user_id_26` (`user_id`),
  UNIQUE KEY `user_id_27` (`user_id`),
  UNIQUE KEY `user_id_28` (`user_id`),
  UNIQUE KEY `user_id_29` (`user_id`),
  UNIQUE KEY `user_id_30` (`user_id`),
  UNIQUE KEY `user_id_31` (`user_id`),
  UNIQUE KEY `user_id_32` (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle hr_db.employee_addresses
CREATE TABLE IF NOT EXISTS `employee_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `address_type` enum('privat','dienstlich','rechnung','versand','andere') NOT NULL,
  `street` varchar(255) NOT NULL,
  `house_number` varchar(50) DEFAULT NULL,
  `zip_code` varchar(20) NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `employee_addresses_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle hr_db.employee_bank_details
CREATE TABLE IF NOT EXISTS `employee_bank_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `iban` varchar(34) NOT NULL,
  `bic` varchar(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  CONSTRAINT `employee_bank_details_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle hr_db.employee_tax_social_security
CREATE TABLE IF NOT EXISTS `employee_tax_social_security` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `tax_id_number` varchar(14) NOT NULL,
  `social_security_number` varchar(12) NOT NULL,
  `tax_class` int DEFAULT NULL,
  `child_allowances` decimal(3,1) DEFAULT '0.0',
  `church_tax_applicable` tinyint(1) DEFAULT '0',
  `religion` varchar(255) DEFAULT NULL,
  `additional_tax_allowances` decimal(10,2) DEFAULT '0.00',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `tax_id_number` (`tax_id_number`),
  UNIQUE KEY `social_security_number` (`social_security_number`),
  UNIQUE KEY `tax_id_number_2` (`tax_id_number`),
  UNIQUE KEY `social_security_number_2` (`social_security_number`),
  UNIQUE KEY `tax_id_number_3` (`tax_id_number`),
  UNIQUE KEY `tax_id_number_4` (`tax_id_number`),
  UNIQUE KEY `tax_id_number_5` (`tax_id_number`),
  UNIQUE KEY `tax_id_number_6` (`tax_id_number`),
  UNIQUE KEY `social_security_number_3` (`social_security_number`),
  UNIQUE KEY `tax_id_number_7` (`tax_id_number`),
  UNIQUE KEY `social_security_number_4` (`social_security_number`),
  CONSTRAINT `employee_tax_social_security_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für job_db
CREATE DATABASE IF NOT EXISTS `job_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `job_db`;

-- Exportiere Struktur von Tabelle job_db.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location_id` int NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `assigned_user_id` int DEFAULT NULL,
  `actual_start_time` datetime DEFAULT NULL,
  `actual_end_time` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `client_id` int NOT NULL,
  `planned_start_time` datetime DEFAULT NULL,
  `planned_end_time` datetime DEFAULT NULL,
  `before_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `after_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_number` (`job_number`),
  UNIQUE KEY `job_number_2` (`job_number`),
  UNIQUE KEY `job_number_3` (`job_number`),
  UNIQUE KEY `job_number_4` (`job_number`),
  UNIQUE KEY `job_number_5` (`job_number`),
  UNIQUE KEY `job_number_6` (`job_number`),
  UNIQUE KEY `job_number_7` (`job_number`),
  UNIQUE KEY `job_number_8` (`job_number`),
  UNIQUE KEY `job_number_9` (`job_number`),
  UNIQUE KEY `job_number_10` (`job_number`),
  UNIQUE KEY `job_number_11` (`job_number`),
  UNIQUE KEY `job_number_12` (`job_number`),
  UNIQUE KEY `job_number_13` (`job_number`),
  UNIQUE KEY `job_number_14` (`job_number`),
  UNIQUE KEY `job_number_15` (`job_number`),
  UNIQUE KEY `job_number_16` (`job_number`),
  UNIQUE KEY `job_number_17` (`job_number`),
  UNIQUE KEY `job_number_18` (`job_number`),
  UNIQUE KEY `job_number_19` (`job_number`),
  UNIQUE KEY `job_number_20` (`job_number`),
  UNIQUE KEY `job_number_21` (`job_number`),
  UNIQUE KEY `job_number_22` (`job_number`),
  UNIQUE KEY `job_number_23` (`job_number`),
  UNIQUE KEY `job_number_24` (`job_number`),
  UNIQUE KEY `job_number_25` (`job_number`),
  UNIQUE KEY `job_number_26` (`job_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2016 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet die aktiven AuftrÃ¤ge';

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für location_db
CREATE DATABASE IF NOT EXISTS `location_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `location_db`;

-- Exportiere Struktur von Tabelle location_db.locations
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL COMMENT 'ZugehÃ¶riger Kunde (logische VerknÃ¼pfung zum Client Service)',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name des Einsatzortes (z.B. Treppenhaus B, GebÃ¤ude C)',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `nfc_tag_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Eindeutige ID des NFC-Tags am Einsatzort',
  `contact_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer_location',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nfc_tag_id` (`nfc_tag_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet Einsatzorte mit GPS und NFC-Tag-IDs';

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für payroll_db
CREATE DATABASE IF NOT EXISTS `payroll_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `payroll_db`;

-- Exportiere Struktur von Tabelle payroll_db.payroll_runs
CREATE TABLE IF NOT EXISTS `payroll_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `runDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','calculated','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
  `totalGrossSalary` decimal(10,2) DEFAULT '0.00',
  `totalNetSalary` decimal(10,2) DEFAULT '0.00',
  `createdByUserId` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `payroll_runs_chk_1` CHECK (((`month` >= 1) and (`month` <= 12))),
  CONSTRAINT `payroll_runs_chk_2` CHECK ((`year` >= 2000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle payroll_db.payslips
CREATE TABLE IF NOT EXISTS `payslips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payrollRunId` int NOT NULL,
  `employeeId` int NOT NULL,
  `grossSalary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `netSalary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `taxAmount` decimal(10,2) DEFAULT '0.00',
  `socialSecurityAmount` decimal(10,2) DEFAULT '0.00',
  `healthInsuranceEmployeeShare` decimal(10,2) DEFAULT '0.00',
  `nursingInsuranceEmployeeShare` decimal(10,2) DEFAULT '0.00',
  `pensionInsuranceEmployeeShare` decimal(10,2) DEFAULT '0.00',
  `unemploymentInsuranceEmployeeShare` decimal(10,2) DEFAULT '0.00',
  `employerSocialSecurityTotal` decimal(10,2) DEFAULT '0.00',
  `otherDeductions` json DEFAULT NULL,
  `bonuses` json DEFAULT NULL,
  `allowances` json DEFAULT NULL,
  `taxClass` enum('I','II','III','IV','IV/IV','V','VI') DEFAULT NULL,
  `childAllowances` decimal(3,1) DEFAULT '0.0',
  `maritalStatus` enum('Ledig','Verheiratet','Geschieden','Verwitwet','Eingetragene Partnerschaft','Unbekannt') DEFAULT NULL,
  `payrollPeriodStart` date NOT NULL,
  `payrollPeriodEnd` date NOT NULL,
  `payslipDate` date NOT NULL DEFAULT (curdate()),
  `status` enum('generated','distributed','corrected','cancelled') NOT NULL DEFAULT 'generated',
  `documentPath` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payrollRunId` (`payrollRunId`),
  KEY `idx_payslips_employeeId` (`employeeId`),
  CONSTRAINT `payslips_ibfk_1` FOREIGN KEY (`payrollRunId`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daten-Export vom Benutzer nicht ausgewählt


-- Exportiere Datenbank-Struktur für shift_db
CREATE DATABASE IF NOT EXISTS `shift_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `shift_db`;

-- Exportiere Struktur von Tabelle shift_db.shifts
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `check_in_time` datetime NOT NULL,
  `check_in_latitude` decimal(10,7) NOT NULL,
  `check_in_longitude` decimal(10,7) NOT NULL,
  `badge_id_scanned` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `check_out_latitude` decimal(10,7) DEFAULT NULL,
  `check_out_longitude` decimal(10,7) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daten-Export vom Benutzer nicht ausgewählt

-- Exportiere Struktur von Tabelle shift_db.shift_logs
CREATE TABLE IF NOT EXISTS `shift_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shift_id` int NOT NULL COMMENT 'ZugehÃ¶rige Schicht (logische VerknÃ¼pfung innerhalb des Shift Service)',
  `job_id` int DEFAULT NULL COMMENT 'ZugehÃ¶riger Job (logische VerknÃ¼pfung zum Job Service)',
  `timestamp` datetime NOT NULL,
  `log_type` enum('CHECKIN','CHECKOUT','START_JOB','END_JOB','GPS_UPDATE','PHOTO_PROOF','NOTE','CHECKLIST') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gps_latitude` decimal(10,8) DEFAULT NULL,
  `gps_longitude` decimal(11,8) DEFAULT NULL,
  `photo_data` mediumblob,
  `checklist_data` json DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detaillierte Protokollierung aller Aktionen und Standortdaten';

-- Daten-Export vom Benutzer nicht ausgewählt

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

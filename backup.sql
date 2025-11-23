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

-- Exportiere Daten aus Tabelle auth_db.roles: ~4 rows (ungefähr)
INSERT INTO `roles` (`id`, `name`, `description`, `is_time_tracker_required`, `can_manage_users`) VALUES
	(1, 'Admin', 'Volle administrative Kontrolle.', 0, 1),
	(2, 'Manager', 'Manager-Rolle mit vollem Zugriff auf operative Funktionen.', 0, 1),
	(3, 'Disponent', 'Auftragsverwaltung und Zuweisung.', 0, 0),
	(4, 'Reinigungskraft', 'FÃ¼hrt Jobs aus und erfasst Arbeitszeiten.', 1, 0);

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

-- Exportiere Daten aus Tabelle auth_db.users: ~3 rows (ungefähr)
INSERT INTO `users` (`id`, `role_id`, `full_name`, `pin`, `password`, `external_auth_id`, `is_active`, `createdAt`, `updatedAt`) VALUES
	(1006, 2, 'Sarah Manager', '333333', '$2b$10$s4lugBs5pd5PcbaXH30hHegTXkwUF/ADLzb/7VoNWN2Lpq61QCYdK', NULL, 1, '2025-11-12 01:12:27', '2025-11-18 18:10:39'),
	(1009, 3, 'Dieter Disponent', '846763', '$2b$10$yun.AK/r4YHgEuAaM/vXaOxZDKhY1KWTDWbkU.tBsOp5SXMxw92sy', NULL, 1, '2025-11-12 01:13:55', '2025-11-18 18:10:45'),
	(1015, 4, 'Ronny Webers', '315776', '$2b$10$fhTPAIZQ0sgGmWi/ZCV0ZOus9tcAkIkVrZIvY4OyHJkEHdMR75lMy', NULL, 1, '2025-11-12 23:56:30', '2025-11-22 20:57:04');


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

-- Exportiere Daten aus Tabelle client_db.clients: ~2 rows (ungefähr)
INSERT INTO `clients` (`id`, `name`, `contact_person`, `email`, `phone`, `address`, `createdAt`, `updatedAt`) VALUES
	(1, 'DRP Interne Verwaltung', 'Geschäftsführung', 'info@drp.de', '+49 123 456789', 'Albertstr 7, 47059 Duisburg', '2025-11-13 20:54:03', '2025-11-18 23:48:03'),
	(3, 'Solar Solution GmbH', 'Anna Schmidt', 'anna.schmidt@solar-solutions.de', '+49 987 654321', 'Am Förderturm 10, 47198 Duisburg', '2025-11-12 15:00:35', '2025-11-18 23:47:42');


-- Exportiere Datenbank-Struktur für hr_db
CREATE DATABASE IF NOT EXISTS `hr_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hr_db`;

-- Exportiere Struktur von Tabelle hr_db.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'Logische Referenz zur ID des Benutzers im Auth Service (Auth Service hat eigene DB)',
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `date_of_hire` date NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','on_leave','terminated') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `position` varchar(255) DEFAULT NULL,
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
  UNIQUE KEY `email_13` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Exportiere Daten aus Tabelle hr_db.employees: ~3 rows (ungefähr)
INSERT INTO `employees` (`id`, `user_id`, `first_name`, `last_name`, `email`, `date_of_birth`, `date_of_hire`, `department`, `salary`, `status`, `created_at`, `updated_at`, `position`) VALUES
	(1, 1006, 'Sarah', 'Manager', 'sarah.manager@example.com', '1985-05-15', '2020-01-10', 'Management', 65000.00, 'active', '2025-11-22 12:15:51', '2025-11-22 12:15:51', NULL),
	(2, 1009, 'Dieter', 'Disponent', 'dieter.disponent@example.com', '1990-08-20', '2021-03-01', 'Operations', 52000.00, 'active', '2025-11-22 12:15:51', '2025-11-22 12:15:51', NULL),
	(3, 1015, 'Ronny', 'Weber', 'ronny.weber@example.com', '1992-11-01', '2022-07-15', 'Team1', 45000.00, 'active', '2025-11-22 12:15:51', '2025-11-22 21:05:00', NULL);


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
  UNIQUE KEY `job_number_25` (`job_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2016 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verwaltet die aktiven AuftrÃ¤ge';

-- Exportiere Daten aus Tabelle job_db.jobs: ~6 rows (ungefähr)
INSERT INTO `jobs` (`id`, `job_number`, `title`, `description`, `location_id`, `status`, `assigned_user_id`, `actual_start_time`, `actual_end_time`, `createdAt`, `updatedAt`, `client_id`, `planned_start_time`, `planned_end_time`, `before_photo_url`, `after_photo_url`, `check_in_latitude`, `check_in_longitude`, `check_out_latitude`, `check_out_longitude`) VALUES
	(2010, 'DRP2025-001', 'Reinigung', 'Büro 2', 8, 'PENDING', 1015, NULL, NULL, '2025-11-15 17:07:19', '2025-11-19 15:05:02', 1, '2025-11-25 06:00:00', '2025-11-25 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL),
	(2011, 'DRP2025-002', 'Reinigung', 'Büro 1', 12, 'PENDING', 1015, NULL, NULL, '2025-11-15 18:15:26', '2025-11-19 00:11:54', 1, '2025-11-26 06:00:00', '2025-11-26 14:08:00', NULL, NULL, NULL, NULL, NULL, NULL),
	(2012, 'DRP2025-003', 'Reinigung', 'Büro 2', 8, 'PENDING', 1015, '2025-11-19 15:03:28', '2025-11-19 15:03:57', '2025-11-15 18:31:56', '2025-11-19 15:19:36', 1, '2025-11-27 06:00:00', '2025-11-27 14:00:00', NULL, NULL, 51.44220990, 6.74782950, 51.44220990, 6.74782950),
	(2013, 'DRP2025-004', 'Reinigung', 'Büro 1', 12, 'COMPLETED', 1015, '2025-11-20 16:47:11', '2025-11-20 16:51:55', '2025-11-15 19:17:23', '2025-11-20 16:51:55', 1, '2025-11-20 06:00:00', '2025-11-20 14:00:00', NULL, NULL, 51.44220160, 6.74784960, 51.44220160, 6.74784960),
	(2014, 'DRP2025-005', 'Reinigung', 'Büro 2', 8, 'COMPLETED', 1015, '2025-11-19 19:19:08', '2025-11-19 19:19:29', '2025-11-15 21:46:06', '2025-11-22 16:50:12', 1, '2025-11-21 06:00:00', '2025-11-21 14:00:00', NULL, NULL, 51.44220230, 6.74784040, 51.44219750, 6.74784710),
	(2015, 'DRP2025-006', 'Reinigung', 'Büro 2', 12, 'PENDING', 1015, '2025-11-16 12:11:06', '2025-11-16 12:11:36', '2025-11-15 21:47:04', '2025-11-19 00:12:26', 1, '2025-11-24 06:00:00', '2025-11-24 14:00:00', NULL, NULL, NULL, NULL, NULL, NULL);


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

-- Exportiere Daten aus Tabelle location_db.locations: ~3 rows (ungefähr)
INSERT INTO `locations` (`id`, `client_id`, `name`, `address`, `latitude`, `longitude`, `nfc_tag_id`, `contact_person`, `createdAt`, `updatedAt`, `type`) VALUES
	(1, 1, 'DRP Verwaltung', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-001', 'Herr Schmidt', '2025-11-13 21:00:52', '2025-11-15 18:20:13', 'company_location'),
	(8, 1, 'Verwaltung Büro 2', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-003', 'Frau Huber', '2025-11-12 15:11:45', '2025-11-18 20:01:52', 'customer_location'),
	(12, 1, 'Verwaltung Büro 1', 'Albertstr. 7, 47059 Duisburg', 51.44213680, 6.74782510, 'NFC-LOC-002', 'Herr Schmidt', '2025-11-15 18:14:31', '2025-11-18 20:02:05', 'customer_location'),
	(13, 3, 'Solar Park 1 / Solar Panel 1&2', 'Portsmontsplatz 1, 47051 duisburg', 51.43022300, 6.77337800, 'NFC-LOC-023', 'Herr Schmidt', '2025-11-16 12:14:23', '2025-11-19 15:26:21', 'customer_location'),
	(14, 1, 'Arndt Christoph Handschuh', 'Ruhrorter Str., 86', NULL, NULL, 'NFC-LOC-011', NULL, '2025-11-20 16:48:47', '2025-11-20 16:48:47', 'customer_location');


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

-- Exportiere Daten aus Tabelle shift_db.shifts: ~9 rows (ungefähr)
INSERT INTO `shifts` (`id`, `employee_id`, `check_in_time`, `check_in_latitude`, `check_in_longitude`, `badge_id_scanned`, `date`, `check_out_time`, `check_out_latitude`, `check_out_longitude`, `created_at`, `updated_at`) VALUES
	(6, 1015, '2025-11-14 05:48:48', 51.4421984, 6.7478943, '315776', '2025-11-14', '2025-11-14 14:07:57', 51.4422029, 6.7478835, '2025-11-14 02:48:47', '2025-11-19 15:58:34'),
	(9, 1015, '2025-11-15 05:55:25', 51.4421967, 6.7478794, '315776', '2025-11-15', '2025-11-15 14:16:26', 51.4422162, 6.7478231, '2025-11-14 19:29:24', '2025-11-19 15:58:32'),
	(12, 1015, '2025-11-16 05:55:37', 51.4422059, 6.7478879, '315776', '2025-11-16', '2025-11-16 14:07:10', 51.4421999, 6.7478865, '2025-11-15 18:32:37', '2025-11-19 15:58:30'),
	(13, 1015, '2025-11-17 05:52:16', 51.4421988, 6.7478742, '315776', '2025-11-17', '2025-11-17 14:03:46', 51.4422020, 6.7478530, '2025-11-15 20:28:15', '2025-11-19 15:58:27'),
	(17, 1015, '2025-11-18 05:55:38', 51.4421988, 6.7478638, '315776', '2025-11-18', '2025-11-18 14:10:01', 51.4422096, 6.7478161, '2025-11-17 00:10:37', '2025-11-19 15:58:24'),
	(18, 1015, '2025-11-19 05:55:38', 51.4421988, 6.7478638, '315776', '2025-11-19', '2025-11-19 14:10:01', 51.4422096, 6.7478161, '2025-11-17 00:10:37', '2025-11-19 15:58:14'),
	(19, 1015, '2025-11-19 15:43:07', 51.4422067, 6.7478531, '315776', '2025-11-19', '2025-11-19 16:56:46', 51.4422099, 6.7478295, '2025-11-19 14:43:06', '2025-11-19 15:58:38'),
	(20, 1015, '2025-11-19 16:59:02', 51.4422099, 6.7478295, '315776', '2025-11-19', '2025-11-19 20:21:50', 51.4424457, 6.7479501, '2025-11-19 15:59:02', '2025-11-19 19:21:49'),
	(21, 1015, '2025-11-19 20:22:22', 51.4421990, 6.7478519, '315776', '2025-11-19', '2025-11-20 04:08:31', 51.4424457, 6.7478295, '2025-11-19 19:22:20', '2025-11-20 23:10:18'),
	(22, 1015, '2025-11-20 17:44:19', 51.4422016, 6.7478496, '315776', '2025-11-20', '2025-11-21 00:09:50', 51.4424457, 6.7478295, '2025-11-20 16:44:16', '2025-11-20 23:10:20'),
	(23, 1015, '2025-11-21 00:12:03', 51.4422106, 6.7478334, '315776', '2025-11-21', '2025-11-21 00:12:34', 51.4422106, 6.7478334, '2025-11-20 23:12:03', '2025-11-20 23:12:34');

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

-- Exportiere Daten aus Tabelle shift_db.shift_logs: ~0 rows (ungefähr)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

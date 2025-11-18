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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exportiere Daten aus Tabelle shift_db.shifts: ~9 rows (ungefähr)
INSERT INTO `shifts` (`id`, `employee_id`, `check_in_time`, `check_in_latitude`, `check_in_longitude`, `badge_id_scanned`, `date`, `check_out_time`, `check_out_latitude`, `check_out_longitude`, `created_at`, `updated_at`) VALUES
	(6, 1015, '2025-11-14 03:48:48', 51.4421984, 6.7478943, '3157769787', '2025-11-14', '2025-11-14 08:27:57', 51.4422029, 6.7478835, '2025-11-14 02:48:47', '2025-11-14 07:27:57'),
	(9, 1015, '2025-11-14 20:29:25', 51.4421967, 6.7478794, '3157769787', '2025-11-14', '2025-11-14 23:16:26', 51.4422162, 6.7478231, '2025-11-14 19:29:24', '2025-11-14 22:16:25'),
	(10, 1015, '2025-11-15 13:52:26', 51.4421852, 6.7478985, '3157769787', '2025-11-15', '2025-11-15 17:13:29', 51.4422100, 6.7478801, '2025-11-15 12:52:24', '2025-11-15 16:13:28'),
	(11, 1015, '2025-11-15 17:14:29', 51.4422100, 6.7478801, '3157769787', '2025-11-15', '2025-11-15 19:26:32', 51.4422080, 6.7478717, '2025-11-15 16:14:28', '2025-11-15 18:26:32'),
	(12, 1015, '2025-11-15 19:32:37', 51.4422059, 6.7478879, '3157769787', '2025-11-15', '2025-11-15 20:45:10', 51.4421999, 6.7478865, '2025-11-15 18:32:37', '2025-11-15 19:45:09'),
	(13, 1015, '2025-11-15 21:28:16', 51.4421988, 6.7478742, '3157769787', '2025-11-15', '2025-11-15 23:35:46', 51.4422020, 6.7478530, '2025-11-15 20:28:15', '2025-11-15 22:35:45'),
	(14, 1015, '2025-11-16 02:34:31', 51.4422000, 6.7478693, '3157769787', '2025-11-16', '2025-11-16 02:36:20', 51.4422000, 6.7478693, '2025-11-16 01:34:30', '2025-11-16 01:36:18'),
	(15, 1015, '2025-11-16 12:39:19', 51.4422095, 6.7478482, '3157769787', '2025-11-16', '2025-11-16 13:36:35', 51.4422094, 6.7478555, '2025-11-16 11:39:19', '2025-11-16 12:36:35'),
	(16, 1015, '2025-11-17 01:10:38', 51.4421988, 6.7478638, '3157769787', '2025-11-17', '2025-11-17 10:50:01', 51.4422096, 6.7478161, '2025-11-17 00:10:37', '2025-11-17 09:50:01');

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

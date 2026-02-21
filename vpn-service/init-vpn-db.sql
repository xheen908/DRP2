-- Schema für vpn_db (DRP2)

USE vpn_db;

-- Tabelle für VPN-Netzwerke (z.B. Cloud-Internal, Filiale-A, etc.)
CREATE TABLE IF NOT EXISTS `vpn_networks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `cidr` VARCHAR(50) NOT NULL DEFAULT '10.8.0.0/24',
  `port` INT NOT NULL UNIQUE DEFAULT 51820,
  `private_key` TEXT NOT NULL,
  `public_key` TEXT NOT NULL,
  `endpoint` VARCHAR(255) NOT NULL COMMENT 'Öffentliche IP oder Domain',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelle für VPN-Clients (Mitarbeiter-Geräte, Filial-Router)
CREATE TABLE IF NOT EXISTS `vpn_clients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `network_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT 'Referenz auf auth_db.users',
  `device_name` VARCHAR(255) NOT NULL,
  `client_ip` VARCHAR(15) NOT NULL,
  `private_key` TEXT NOT NULL,
  `public_key` TEXT NOT NULL,
  `preshared_key` VARCHAR(64) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `last_handshake` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`network_id`) REFERENCES `vpn_networks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

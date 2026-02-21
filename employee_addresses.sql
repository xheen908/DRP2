-- Adressen für alle Mitarbeiter in hr_db

USE hr_db;

INSERT IGNORE INTO employee_addresses (employee_id, address_type, street, house_number, zip_code, city, country, is_primary, created_at, updated_at) VALUES
  (1, 'privat', 'Am Innenhafen', '12', '47059', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (2, 'privat', 'Königstraße', '45', '47051', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (3, 'privat', 'Mülheimer Straße', '102', '47057', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (4, 'privat', 'Düsseldorfer Straße', '21', '47053', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (5, 'privat', 'Villengarten', '3', '47058', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (6, 'privat', 'Schifferstraße', '18', '47059', 'Duisburg', 'Deutschland', 1, NOW(), NOW()),
  (7, 'privat', 'Sternstraße', '7', '47057', 'Duisburg', 'Deutschland', 1, NOW(), NOW());

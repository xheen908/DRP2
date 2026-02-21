-- Neue Jobs für die nächste Woche (23.02. - 01.03.2026)

USE job_db;

INSERT IGNORE INTO jobs (job_number, title, description, location_id, status, assigned_user_id, planned_start, planned_end) VALUES
  -- Montag, 23.02.
  ('DRP2026-W09-01', 'Quartalswartung Panel A1-A4', 'Reguläre technische Überprüfung der Wechselrichter und Verkabelung.', 13, 'Offen', 1015, '2026-02-23 08:00:00', '2026-02-23 12:00:00'),
  ('DRP2026-W09-02', 'NFC-Tag Rollout Flur West', 'Installation von 5 neuen NFC-Checkpoints im 2. OG.', 1, 'Offen', 1101, '2026-02-23 09:00:00', '2026-02-23 11:30:00'),
  
  -- Dienstag, 24.02.
  ('DRP2026-W09-03', 'Grundreinigung Büro 1', 'Intensivreinigung der Glasflächen und IT-Arbeitsplätze.', 12, 'Offen', 1103, '2026-02-24 06:00:00', '2026-02-24 14:00:00'),
  ('DRP2026-W09-04', 'Sicherheits-Check Solar Park', 'Prüfung der Umzäunung und Kamerasysteme nach Vandalismusmeldung.', 13, 'Offen', 1101, '2026-02-24 10:00:00', '2026-02-24 13:00:00'),

  -- Mittwoch, 25.02.
  ('DRP2026-W09-05', 'IT-Infrastruktur Umzug Büro 2', 'Verkabelung der neuen Dockingstations und Monitore.', 8, 'Offen', 1015, '2026-02-25 08:00:00', '2026-02-25 16:00:00'),
  ('DRP2026-W09-06', 'Modul-Tausch Wechselrichter 4', 'Defektes Modul gegen Ersatzteil aus Lager Duisburg tauschen.', 13, 'Offen', 1103, '2026-02-25 07:30:00', '2026-02-25 11:00:00'),

  -- Donnerstag, 26.02.
  ('DRP2026-W09-07', 'Brandschutzbegehung Verwaltung', 'Kontrolle der Feuerlöscher und Fluchtwegepläne.', 1, 'Offen', 1101, '2026-02-26 13:00:00', '2026-02-26 16:30:00'),
  ('DRP2026-W09-08', 'Dokumentation Solar-Leistung', 'Manuelle Ablesung der Zählerstände für den Monatsbericht.', 13, 'Offen', 1015, '2026-02-26 09:00:00', '2026-02-26 10:30:00'),

  -- Freitag, 27.02.
  ('DRP2026-W09-09', 'Wochenabschluss Wartung', 'Werkzeugpflege und Inventur im Service-Fahrzeug.', 1, 'Offen', 1103, '2026-02-27 14:00:00', '2026-02-27 16:00:00'),
  ('DRP2026-W09-10', 'Express-Reparatur Büro 1', 'Behebung Wasserschaden an der Decke (provisorisch).', 12, 'Offen', 1101, '2026-02-27 08:00:00', '2026-02-27 12:00:00');

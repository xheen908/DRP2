-- Fix: Gehalt (Salary) auf Stundenlohn umstellen

USE hr_db;

-- Update der Gehälter auf realistische Stundenlöhne (Euro/Std)
UPDATE employees SET salary = 18.50 WHERE user_id = 1101; -- Thomas (Monteur)
UPDATE employees SET salary = 20.00 WHERE user_id = 1102; -- Marina (Disponentin)
UPDATE employees SET salary = 17.50 WHERE user_id = 1103; -- Kevin (Monteur)
UPDATE employees SET salary = 28.00 WHERE user_id = 1104; -- Petra (Managerin HR)
UPDATE employees SET salary = 35.00 WHERE user_id = 1006; -- Sarah (Management)
UPDATE employees SET salary = 22.50 WHERE user_id = 1009; -- Dieter (Disponent)
UPDATE employees SET salary = 19.00 WHERE user_id = 1015; -- Ronny (Monteur)

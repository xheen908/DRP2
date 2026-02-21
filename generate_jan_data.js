const moment = require('moment-timezone');
const fs = require('fs');

const employees = [
    { id: 1015, name: 'Ronny Weber', target: 168 },
    { id: 1101, name: 'Thomas Tester', target: 160 },
    { id: 1102, name: 'Marina Muster', target: 160 },
    { id: 1103, name: 'Kevin Kollege', target: 160 },
    { id: 1104, name: 'Petra Personal', target: 160 },
    { id: 1006, name: 'Sarah Manager', target: 160 },
    { id: 1009, name: 'Dieter Disponent', target: 160 }
];

let sql = "USE shift_db;\n";
sql += "DELETE FROM shifts WHERE start_time >= '2026-01-01 00:00:00' AND start_time < '2026-02-01 00:00:00';\n";
sql += "INSERT INTO shifts (user_id, start_time, end_time, status, notes, total_work_hours, break_duration_minutes, night_hours, sunday_hours) VALUES\n";

const entries = [];

for (let day = 1; day <= 31; day++) {
    const date = moment.tz(`2026-01-${day < 10 ? '0' + day : day}`, 'Europe/Berlin');
    const dayOfWeek = date.day(); // 0 = Sun, 6 = Sat

    employees.forEach(emp => {
        let startTime, endTime, notes, night = 0, sun = 0;
        
        // Skip some days randomly or for specific reasons
        if (dayOfWeek === 6 || dayOfWeek === 0) {
            // Saturday/Sunday: Only Ronny works occasionally
            if (emp.id === 1015 && day % 10 === 0) {
                startTime = date.clone().hour(10).minute(0);
                endTime = date.clone().hour(18).minute(0);
                notes = "Wochenendschicht";
                if (dayOfWeek === 0) sun = 8.0;
            } else {
                return;
            }
        } else {
            // Weekday
            startTime = date.clone().hour(8).minute(0);
            endTime = date.clone().hour(16).minute(30); // 8.5h Gross
            notes = "Regulär";
            
            // Variaton for Ronny (Overtime)
            if (emp.id === 1015 && day % 3 === 0) {
                endTime.hour(19); // 11h Gross
                notes = "Überstunden Tag";
            }
            
            // Night shift test for Thomas
            if (emp.id === 1101 && day === 15) {
                startTime.hour(20);
                endTime = date.clone().add(1, 'day').hour(4);
                night = 8.0;
                notes = "Nachtschicht";
            }
        }

        const grossMin = endTime.diff(startTime, 'minutes');
        let brk = grossMin >= 540 ? 45 : (grossMin >= 360 ? 30 : 0);
        let netH = (grossMin - brk) / 60;

        entries.push(`(${emp.id}, '${startTime.format('YYYY-MM-DD HH:mm:ss')}', '${endTime.format('YYYY-MM-DD HH:mm:ss')}', 'Abgeschlossen', '${notes}', ${netH.toFixed(2)}, ${brk}, ${night.toFixed(2)}, ${sun.toFixed(2)})`);
    });
}

sql += entries.join(",\n") + ";";
fs.writeFileSync('D:/DRP2/demo_january_shifts.sql', sql);
console.log("SQL file generated.");

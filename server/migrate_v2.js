const Database = require('better-sqlite3');
const db = new Database('attendance.db', { verbose: console.log });

try {
    console.log("Starting V2 Migration...");

    // Users Table
    const userColumns = [
        "matric_no TEXT",
        "level TEXT",
        "department TEXT",
        "course TEXT",
        "photo TEXT"
    ];

    for (const col of userColumns) {
        try {
            db.prepare(`ALTER TABLE users ADD COLUMN ${col}`).run();
            console.log(`Added ${col.split(' ')[0]} to users`);
        } catch (e) {
            console.log(`${col.split(' ')[0]} likely exists or error:`, e.message);
        }
    }

    // Sessions Table
    try {
        db.prepare("ALTER TABLE sessions ADD COLUMN type TEXT DEFAULT 'in'").run();
        console.log("Added type to sessions");
    } catch (e) {
        console.log("Column type likely exists or error:", e.message);
    }

    console.log("V2 Migration Complete");

} catch (err) {
    console.error("Migration failed:", err);
}

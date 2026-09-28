require('dotenv').config();
const { Pool } = require('pg');

async function batchPurge() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const targets = ['IKECHUKWU VICTOR SIMEON', 'NWABINELI CHARLES ARINZE'];

    try {
        for (const name of targets) {
            console.log(`Searching for: ${name}`);
            const { rows } = await pool.query('SELECT id, name FROM users WHERE name ILIKE $1', [`%${name}%`]);

            if (rows.length === 0) {
                console.log(`No match found for: ${name}`);
                continue;
            }

            for (const user of rows) {
                console.log(`Purging ID ${user.id}: ${user.name}`);
                await pool.query('DELETE FROM attendance WHERE user_id = $1', [user.id]);
                await pool.query('DELETE FROM enrollments WHERE user_id = $1', [user.id]);
                await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
                console.log(`Successfully removed ${user.name} from Aiven Cloud.`);
            }
        }
    } catch (err) {
        console.error("Batch purge failed:", err.message);
    } finally {
        await pool.end();
    }
}

batchPurge();

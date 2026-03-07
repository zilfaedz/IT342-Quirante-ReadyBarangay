const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../../docs/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but ignore ones inside quotes (basic split)
        // Since schema.sql is simple, we can split by ; followed by newline
        const statements = schema.split(/;\s*\n/).filter(s => s.trim() !== '');

        for (let statement of statements) {
            console.log(`Executing statement: ${statement.substring(0, 50)}...`);
            try {
                await pool.query(statement);
            } catch (err) {
                // Ignore errors if column/constraint already exists
                if (err.errno === 1060 || err.errno === 1061 || err.errno === 1022) {
                    console.log(`Skipping: ${err.sqlMessage}`);
                } else if (statement.trim().startsWith('ALTER TABLE') && err.errno === 1091) {
                    console.log(`Skipping: ${err.sqlMessage}`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Database initialized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDb();

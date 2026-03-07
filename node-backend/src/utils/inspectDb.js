const pool = require('../config/database');

async function inspectDb() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables);

        for (let tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            console.log(`\nStructure of ${tableName}:`);
            const [desc] = await pool.query(`DESCRIBE ${tableName}`);
            console.table(desc);

            const [create] = await pool.query(`SHOW CREATE TABLE ${tableName}`);
            console.log(create[0]['Create Table']);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error inspecting database:', error);
        process.exit(1);
    }
}

inspectDb();

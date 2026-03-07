const UserModel = require('./src/models/userModel');
const pool = require('./src/config/database');

async function createFirstAdmin() {
    try {
        console.log("Seeding first System Admin...");

        const name = "Super Admin";
        const email = "admin@readybarangay.com";
        const password = "adminpassword123"; // Change this before deploying
        const role = "System Admin";

        // Check if admin already exists
        const existingAdmin = await UserModel.findByEmail(email);
        if (existingAdmin) {
            console.log(`Admin with email ${email} already exists!`);
            process.exit(0);
        }

        const adminId = await UserModel.createUser(name, email, password, role, null);
        console.log(`✅ Success! System Admin created.`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Admin ID in database: ${adminId}`);
    } catch (error) {
        console.error("❌ Failed to create admin:", error);
    } finally {
        // Close DB connection pool
        await pool.end();
        process.exit(0);
    }
}

createFirstAdmin();

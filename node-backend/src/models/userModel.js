const pool = require('../config/database');
const bcrypt = require('bcrypt');

const UserModel = {
    async createUser(connection, name, email, password, role = 'Resident', barangayId = null) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (name, email, password_hash, role, barangay_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await (connection || pool).execute(query, [name, email, hashedPassword, role, barangayId]);
        return result.insertId;
    },

    async updateRole(connection, userId, role) {
        const query = 'UPDATE users SET role = ? WHERE id = ?';
        await (connection || pool).execute(query, [role, userId]);
    },

    async updateStatus(userId, status) {
        const query = 'UPDATE users SET status = ? WHERE id = ?';
        await pool.execute(query, [status, userId]);
    },

    async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    },

    async findById(id) {
        const query = `SELECT id, name, email, role, barangay_id, status, created_at FROM users WHERE id = ?`;
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    },

    async getAllUsers() {
        // System admin feature
        const query = `SELECT id, name, email, role, barangay_id, created_at FROM users`;
        const [rows] = await pool.execute(query);
        return rows;
    }
};

module.exports = UserModel;

const pool = require('../config/database');

const logAudit = async (userId, action, targetId = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, target_id)
            VALUES (?, ?, ?)
        `;
        await pool.execute(query, [userId, action, targetId]);
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

module.exports = { logAudit };

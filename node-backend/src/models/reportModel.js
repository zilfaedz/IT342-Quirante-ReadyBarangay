const pool = require('../config/database');

const ReportModel = {
    async createReport(userId, barangayId, incidentType, description, location, photoUrl = null) {
        const query = `
            INSERT INTO reports (user_id, barangay_id, incident_type, description, location, photo_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [userId, barangayId, incidentType, description, location, photoUrl]);
        return result.insertId;
    },

    async getReportsByUserId(userId) {
        const query = `SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC`;
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    },

    async getReportsByBarangayId(barangayId) {
        const query = `SELECT * FROM reports WHERE barangay_id = ? ORDER BY created_at DESC`;
        const [rows] = await pool.execute(query, [barangayId]);
        return rows;
    },

    async getAllReports() {
        const query = `SELECT * FROM reports ORDER BY created_at DESC`;
        const [rows] = await pool.execute(query);
        return rows;
    },

    async updateReportStatus(reportId, newStatus) {
        const query = `UPDATE reports SET status = ? WHERE id = ?`;
        const [result] = await pool.execute(query, [newStatus, reportId]);
        return result.affectedRows;
    },

    async getReportById(reportId) {
        const query = `SELECT * FROM reports WHERE id = ?`;
        const [rows] = await pool.execute(query, [reportId]);
        return rows[0];
    }
};

module.exports = ReportModel;

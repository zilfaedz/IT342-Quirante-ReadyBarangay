const pool = require('../config/database');

const BarangayModel = {
    async findByPsgc(psgcCode) {
        const query = 'SELECT * FROM barangays WHERE psgc_code = ?';
        const [rows] = await pool.execute(query, [psgcCode]);
        return rows[0];
    },

    async findById(id) {
        const query = 'SELECT * FROM barangays WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    },

    async createBarangay(connection, barangayData) {
        const query = `
            INSERT INTO barangays (
                psgc_code, barangay_name, city_name, city_code, 
                province_name, province_code, region_name, region_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            barangayData.psgcCode,
            barangayData.barangayName,
            barangayData.cityName,
            barangayData.cityCode,
            barangayData.provinceName,
            barangayData.provinceCode,
            barangayData.regionName,
            barangayData.regionCode
        ];
        const [result] = await (connection || pool).execute(query, params);
        return result.insertId;
    },

    async updateCaptain(connection, barangayId, captainId) {
        const query = 'UPDATE barangays SET captain_id = ? WHERE id = ?';
        await (connection || pool).execute(query, [captainId, barangayId]);
    },

    async logCaptainChange(connection, barangayId, oldCaptainId, newCaptainId, adminId, reason) {
        const query = `
            INSERT INTO captain_history (barangay_id, old_captain_id, new_captain_id, changed_by, reason)
            VALUES (?, ?, ?, ?, ?)
        `;
        await (connection || pool).execute(query, [barangayId, oldCaptainId, newCaptainId, adminId, reason]);
    }
};

module.exports = BarangayModel;

const UserModel = require('../models/userModel');
const { logAudit } = require('../utils/logger');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        await logAudit(req.user.id, 'VIEWED_ALL_USERS_DB');
        res.json(users);
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const pool = require('../config/database');
const BarangayModel = require('../models/barangayModel');

exports.transferCaptainship = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { barangayId, newCaptainId, reason } = req.body;
        const adminId = req.user.id;

        // 1. Get current barangay info
        const barangay = await BarangayModel.findById(barangayId);
        if (!barangay) {
            await connection.rollback();
            return res.status(404).json({ message: 'Barangay not found' });
        }

        const oldCaptainId = barangay.captain_id;

        // 2. Validate new captain
        const newCaptain = await UserModel.findById(newCaptainId);
        if (!newCaptain) {
            await connection.rollback();
            return res.status(404).json({ message: 'New captain user not found' });
        }

        // 3. Demote old captain (if exists)
        if (oldCaptainId) {
            await UserModel.updateRole(connection, oldCaptainId, 'Resident');
        }

        // 4. Promote new captain
        await UserModel.updateRole(connection, newCaptainId, 'Barangay Captain');

        // 5. Update Barangay record
        await BarangayModel.updateCaptain(connection, barangayId, newCaptainId);

        // 6. Log history
        await BarangayModel.logCaptainChange(connection, barangayId, oldCaptainId, newCaptainId, adminId, reason);

        await connection.commit();
        res.json({ message: 'Captainship transferred successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Transfer Captainship Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body; // 'active' or 'suspended'
        await UserModel.updateStatus(userId, status);
        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

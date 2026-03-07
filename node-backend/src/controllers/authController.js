const pool = require('../config/database');
const BarangayModel = require('../models/barangayModel');
const UserModel = require('../models/userModel');

exports.register = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, email, password, role, locationData } = req.body;

        // 1. Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            await connection.rollback();
            return res.status(400).json({ message: 'Email already in use' });
        }

        const requestedRole = role || 'Resident';
        let barangayId = null;

        if (requestedRole === 'Barangay Captain') {
            // Rule 2 & 4: Barangay Captain registration
            const existingBarangay = await BarangayModel.findByPsgc(locationData.psgcCode);

            if (existingBarangay) {
                if (existingBarangay.captain_id) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'This barangay already has a registered captain.' });
                }
                barangayId = existingBarangay.id;
            } else {
                // Create new barangay
                barangayId = await BarangayModel.createBarangay(connection, {
                    psgcCode: locationData.psgcCode,
                    barangayName: locationData.barangayName,
                    cityName: locationData.cityName,
                    cityCode: locationData.cityCode,
                    provinceName: locationData.provinceName,
                    provinceCode: locationData.provinceCode,
                    regionName: locationData.regionName,
                    regionCode: locationData.regionCode
                });
            }

            // Create user
            const userId = await UserModel.createUser(connection, name, email, password, 'Barangay Captain', barangayId);

            // Link captain to barangay
            await BarangayModel.updateCaptain(connection, barangayId, userId);

            await connection.commit();
            return res.status(201).json({ message: 'Barangay and Captain registered successfully', userId });

        } else if (requestedRole === 'Resident') {
            // Rule 3: Resident registration
            const existingBarangay = await BarangayModel.findByPsgc(locationData.psgcCode);

            if (!existingBarangay) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'This barangay is not yet registered. Please contact your Barangay Captain.'
                });
            }

            const userId = await UserModel.createUser(connection, name, email, password, 'Resident', existingBarangay.id);

            await connection.commit();
            return res.status(201).json({ message: 'Resident registered successfully', userId });
        } else if (requestedRole === 'Admin') {
            // Strictly for system setup or manually created
            const userId = await UserModel.createUser(connection, name, email, password, 'Admin', null);
            await connection.commit();
            return res.status(201).json({ message: 'System Admin registered successfully', userId });
        } else {
            await connection.rollback();
            return res.status(400).json({ message: 'Invalid role requested' });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await logAudit(user.id, 'FAILED_LOGIN_ATTEMPT');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, barangayId: user.barangay_id, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret_for_dev',
            { expiresIn: '1d' }
        );

        await logAudit(user.id, 'USER_LOGGED_IN');

        res.json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                barangayId: user.barangay_id
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

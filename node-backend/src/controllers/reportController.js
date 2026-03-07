const ReportModel = require('../models/reportModel');
const { logAudit } = require('../utils/logger');

exports.createReport = async (req, res) => {
    try {
        const { incidentType, description, location } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // barangayId is taken from token payload (if user is assigned to one)
        // For simplicity, defaulting to 1 if not set
        const barangayId = req.user.barangayId || 1;

        const reportId = await ReportModel.createReport(
            req.user.id,
            barangayId,
            incidentType,
            description,
            location,
            photoUrl
        );

        await logAudit(req.user.id, 'REPORT_CREATED', reportId);

        res.status(201).json({ message: 'Report created successfully', reportId });
    } catch (error) {
        console.error('Create Report Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getMyReports = async (req, res) => {
    try {
        const reports = await ReportModel.getReportsByUserId(req.user.id);
        res.json(reports);
    } catch (error) {
        console.error('Get My Reports Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getBarangayReports = async (req, res) => {
    try {
        const barangayId = req.user.barangayId;
        if (!barangayId) {
            return res.status(400).json({ message: 'User is not assigned to a barangay' });
        }
        const reports = await ReportModel.getReportsByBarangayId(barangayId);
        res.json(reports);
    } catch (error) {
        console.error('Get Barangay Reports Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'Responding', 'Resolved'

        if (!['Pending', 'Responding', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const affectedRows = await ReportModel.updateReportStatus(id, status);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        await logAudit(req.user.id, `REPORT_STATUS_UPDATED_TO_${status.toUpperCase()}`, id);
        res.json({ message: 'Report status updated successfully' });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getCityAnalytics = async (req, res) => {
    try {
        // Mock analytics data logic
        const reports = await ReportModel.getAllReports();

        const analytics = {
            totalReports: reports.length,
            pending: reports.filter(r => r.status === 'Pending').length,
            responding: reports.filter(r => r.status === 'Responding').length,
            resolved: reports.filter(r => r.status === 'Resolved').length,
        };

        res.json(analytics);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

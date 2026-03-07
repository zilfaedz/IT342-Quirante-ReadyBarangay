const { logAudit } = require('../utils/logger');

const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized access attempt
            console.warn(`[AUDIT] User ${req.user.id} attempted to access restricted route. Required roles: ${allowedRoles.join(', ')}. Actual role: ${req.user.role}`);

            // Log into DB if logger is implemented
            if (logAudit) {
                await logAudit(req.user.id, `UNAUTHORIZED_ACCESS_ATTEMPT: ${req.originalUrl}`);
            }

            return res.status(403).json({
                message: 'Forbidden. You do not have permission to perform this action.'
            });
        }

        next();
    };
};

module.exports = { authorizeRoles };

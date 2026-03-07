import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Changed from 5000 to match backend
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

// Reports
export const getReports = () => api.get('/reports');
export const assignResponder = (reportId, responderId) => api.put(`/reports/${reportId}/assign`, { responderId });
export const updateReportStatus = (reportId, status) => api.put(`/reports/${reportId}/status`, { status });
export const submitReport = (formData) => api.post('/reports', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// Dashboard Data
export const getDashboardData = () => api.get('/dashboard/data');

// User Management
export const getUsers = () => api.get('/user/all');
export const updateUserRole = (userId, role) => api.put(`/user/${userId}/role`, { role });
export const transferCaptain = (targetUserId) => api.post('/user/transfer-captain', { targetUserId });

export const initiateTransfer = (formData) => api.post('/transfers/initiate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const verifyTransfer = (formData) => api.post('/transfers/verify-new-captain', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

export const updateProfile = (profileData) => api.put('/user/profile', profileData);
export const getBarangayStats = () => api.get('/user/barangay-stats');
export const uploadProfilePicture = (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/user/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Admin Transfers
export const getPendingTransfers = () => api.get('/admin/transfers');
export const approveTransferSubmit = (id) => api.post(`/admin/transfers/${id}/approve`);
export const rejectTransferSubmit = (id, reason) => api.post(`/admin/transfers/${id}/reject`, { reason });

// Evacuation Centers
export const getEvacuationCenters = () => api.get('/evacuation-centers').then(res => res.data);
export const getScopedEvacuationCenters = (scope = 'province') =>
    api.get(`/evacuation-centers/scoped?scope=${encodeURIComponent(scope)}`).then(res => res.data);
export const createEvacuationCenter = (formData) => api.post('/evacuation-centers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateEvacuationCenter = (id, data) => {
    const params = new URLSearchParams(data);
    return api.put(`/evacuation-centers/${id}?${params.toString()}`);
};
export const deleteEvacuationCenter = (id) => api.delete(`/evacuation-centers/${id}`);

// Community Directory
export const getCommunityDirectory = () => api.get('/directory');
export const toggleDirectoryOptIn = (optIn) => api.post('/directory/opt-in', { optIn });
export const updatePurok = (purok) => api.put('/directory/purok', { purok });

export default api;

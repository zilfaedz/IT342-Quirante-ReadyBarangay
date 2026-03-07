/**
 * Express Proxy Example (locationProxy.js)
 * 
 * Usage:
 * const express = require('express');
 * const axios = require('axios');
 * const app = express();
 * 
 * This proxy handles API requests to the PSGC GitLab API
 * and bypasses potential CORS or client-side caching issues.
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Cache simple results for 1 hour
const cache = new Map();

router.get('/regions', async (req, res) => {
    try {
        if (cache.has('regions')) return res.json(cache.get('regions'));
        const response = await axios.get(`${PSGC_BASE_URL}/regions`);
        cache.set('regions', response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
});

router.get('/regions/:code/provinces', async (req, res) => {
    try {
        const response = await axios.get(`${PSGC_BASE_URL}/regions/${req.params.code}/provinces`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
});

router.get('/provinces/:code/cities-municipalities', async (req, res) => {
    try {
        const response = await axios.get(`${PSGC_BASE_URL}/provinces/${req.params.code}/cities-municipalities`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});

router.get('/cities-municipalities/:code/barangays', async (req, res) => {
    try {
        const response = await axios.get(`${PSGC_BASE_URL}/cities-municipalities/${req.params.code}/barangays`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch barangays' });
    }
});

module.exports = router;

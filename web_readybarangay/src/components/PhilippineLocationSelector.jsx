import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

/**
 * PhilippineLocationSelector Component
 *
 * A cascading dropdown component for Philippine geographic locations.
 * Structure: Region → Province → City/Municipality → Barangay
 *
 * @param {Function} onLocationChange - Callback triggered when any level changes.
 * Returns an object with the current selection state.
 */
const PhilippineLocationSelector = ({ onLocationChange }) => {
    const API_BASE = "https://psgc.gitlab.io/api";

    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState({ code: '', name: '' });
    const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
    const [selectedCity, setSelectedCity] = useState({ code: '', name: '' });
    const [selectedBarangay, setSelectedBarangay] = useState({ code: '', name: '' });

    const [loading, setLoading] = useState({
        regions: false, provinces: false, cities: false, barangays: false
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRegions = async () => {
            setLoading(prev => ({ ...prev, regions: true }));
            try {
                const response = await axios.get(`${API_BASE}/regions/`);
                setRegions(response.data.sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch (err) {
                setError("Failed to load regions. Please check your connection.");
            } finally {
                setLoading(prev => ({ ...prev, regions: false }));
            }
        };
        fetchRegions();
    }, []);

    useEffect(() => {
        if (!selectedRegion.code) { setProvinces([]); return; }
        const fetchProvinces = async () => {
            setLoading(prev => ({ ...prev, provinces: true }));
            try {
                const response = await axios.get(`${API_BASE}/regions/${selectedRegion.code}/provinces/`);
                setProvinces(response.data.sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch { setError("Failed to load provinces."); }
            finally { setLoading(prev => ({ ...prev, provinces: false })); }
        };
        fetchProvinces();
    }, [selectedRegion.code]);

    useEffect(() => {
        if (!selectedProvince.code) { setCities([]); return; }
        const fetchCities = async () => {
            setLoading(prev => ({ ...prev, cities: true }));
            try {
                const response = await axios.get(`${API_BASE}/provinces/${selectedProvince.code}/cities-municipalities/`);
                setCities(response.data.sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch { setError("Failed to load cities."); }
            finally { setLoading(prev => ({ ...prev, cities: false })); }
        };
        fetchCities();
    }, [selectedProvince.code]);

    useEffect(() => {
        if (!selectedCity.code) { setBarangays([]); return; }
        const fetchBarangays = async () => {
            setLoading(prev => ({ ...prev, barangays: true }));
            try {
                const response = await axios.get(`${API_BASE}/cities-municipalities/${selectedCity.code}/barangays/`);
                setBarangays(response.data.sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch { setError("Failed to load barangays."); }
            finally { setLoading(prev => ({ ...prev, barangays: false })); }
        };
        fetchBarangays();
    }, [selectedCity.code]);

    useEffect(() => {
        if (onLocationChange) {
            onLocationChange({ region: selectedRegion, province: selectedProvince, city: selectedCity, barangay: selectedBarangay });
        }
    }, [selectedRegion, selectedProvince, selectedCity, selectedBarangay, onLocationChange]);

    const handleRegionChange = (e) => {
        const option = e.target.selectedOptions[0];
        setSelectedRegion({ code: e.target.value, name: option.text });
        setSelectedProvince({ code: '', name: '' });
        setSelectedCity({ code: '', name: '' });
        setSelectedBarangay({ code: '', name: '' });
    };

    const handleProvinceChange = (e) => {
        const option = e.target.selectedOptions[0];
        setSelectedProvince({ code: e.target.value, name: option.text });
        setSelectedCity({ code: '', name: '' });
        setSelectedBarangay({ code: '', name: '' });
    };

    const handleCityChange = (e) => {
        const option = e.target.selectedOptions[0];
        setSelectedCity({ code: e.target.value, name: option.text });
        setSelectedBarangay({ code: '', name: '' });
    };

    const handleBarangayChange = (e) => {
        const option = e.target.selectedOptions[0];
        setSelectedBarangay({ code: e.target.value, name: option.text });
    };

    const fields = [
        {
            label: 'Region',
            value: selectedRegion.code,
            onChange: handleRegionChange,
            disabled: loading.regions,
            isLoading: loading.regions,
            options: regions,
            placeholder: '-- Select Region --',
        },
        {
            label: 'Province',
            value: selectedProvince.code,
            onChange: handleProvinceChange,
            disabled: loading.provinces || !selectedRegion.code,
            isLoading: loading.provinces,
            options: provinces,
            placeholder: '-- Select Province --',
        },
        {
            label: 'City / Municipality',
            value: selectedCity.code,
            onChange: handleCityChange,
            disabled: loading.cities || !selectedProvince.code,
            isLoading: loading.cities,
            options: cities,
            placeholder: '-- Select City --',
        },
        {
            label: 'Barangay',
            value: selectedBarangay.code,
            onChange: handleBarangayChange,
            disabled: loading.barangays || !selectedCity.code,
            isLoading: loading.barangays,
            options: barangays,
            placeholder: '-- Select Barangay --',
        },
    ];

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            {error && (
                <div style={{ color: '#e53e3e', fontSize: '12px', padding: '6px 0' }}>
                    {error}
                </div>
            )}

            {fields.map(({ label, value, onChange, disabled, isLoading, options, placeholder }) => (
                <div className="auth-field-group" key={label}>
                    <label className="auth-label">
                        {label}
                        {isLoading && <span style={{ marginLeft: 6, fontSize: '11px', opacity: 0.6 }}>Loading...</span>}
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <MapPin size={16} />
                        </span>
                        <select
                            className="auth-input"
                            value={value}
                            onChange={onChange}
                            disabled={disabled}
                            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                            <option value="">{placeholder}</option>
                            {options.map(o => (
                                <option key={o.code} value={o.code}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PhilippineLocationSelector;
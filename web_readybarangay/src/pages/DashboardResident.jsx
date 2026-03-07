import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    MapPin, Sun, CloudSun, CloudFog, CloudRain, CloudRainWind, CloudLightning,
    Droplets, Wind, Globe, AlertTriangle, Siren, Waves, TreeDeciduous,
    Flame, Mountain, LifeBuoy, Zap, FileText, Camera, CheckCircle2,
    Building2, Megaphone, ClipboardList, Bell, Phone, Clock,
    Edit2, Trash2, Lock, Navigation, Search, X, ChevronRight,
    ShieldCheck, Radio, Users, Map, Heart, Shield
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./DashboardResident.css";
import "../global.css";
import LogoutModal from "../components/LogoutModal";
import OnboardingModal from "../components/OnboardingModal";
import Settings from "../components/Settings";
import {
    submitReport,
    getReports,
    getDashboardData,
    getScopedEvacuationCenters,
    getCommunityDirectory,
    toggleDirectoryOptIn,
    updateProfile,
    updatePurok
} from "../services/api";

// Fix default marker icon issues with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ---- SIDEBAR NAV ----
const RESIDENT_NAV = [
    { icon: <MapPin size={18} />, label: "Dashboard", id: "dashboard" },
    { icon: <AlertTriangle size={18} />, label: "Emergency Reports", id: "report" },
    { icon: <Building2 size={18} />, label: "Evacuation Centers", id: "evacuation" },
    { icon: <Bell size={18} />, label: "Announcements", id: "announcements" },
    { icon: <Navigation size={18} />, label: "Settings", id: "settings" },
    { icon: <Lock size={18} />, label: "Logout", id: "logout" },
];

// Local sidebar removed in favor of global Sidebar and horizontal tabs.

// ---- WEATHER WIDGET ----
const WEATHER_CODE_MAP = {
    0: { label: "Clear", Icon: Sun, color: "#FFA000" },
    1: { label: "Mostly Clear", Icon: Sun, color: "#FFA000" },
    2: { label: "Partly Cloudy", Icon: CloudSun, color: "#757575" },
    3: { label: "Overcast", Icon: CloudSun, color: "#757575" },
    45: { label: "Foggy", Icon: CloudFog, color: "#9E9E9E" },
    48: { label: "Foggy", Icon: CloudFog, color: "#9E9E9E" },
    51: { label: "Light Drizzle", Icon: CloudRain, color: "#2563eb" },
    61: { label: "Rainy", Icon: CloudRain, color: "#2563eb" },
    71: { label: "Rainy", Icon: CloudRain, color: "#2563eb" },
    80: { label: "Showers", Icon: CloudRainWind, color: "#2563eb" },
    95: { label: "Thunderstorm", Icon: CloudLightning, color: "#D32F2F" },
};

function getWeatherInfo(code) {
    if (code === 0 || code === 1) return WEATHER_CODE_MAP[0];
    if (code === 2 || code === 3) return WEATHER_CODE_MAP[2];
    if (code >= 45 && code <= 48) return WEATHER_CODE_MAP[45];
    if (code >= 51 && code <= 67) return WEATHER_CODE_MAP[51];
    if (code >= 80 && code <= 82) return WEATHER_CODE_MAP[80];
    if (code >= 95) return WEATHER_CODE_MAP[95];
    return WEATHER_CODE_MAP[0];
}

const FORECAST_ICONS = [CloudSun, CloudRain, CloudLightning, CloudSun, Sun];
const FORECAST_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=10.3157&longitude=123.8854&current_weather=true&hourly=relative_humidity_2m"
                );
                const data = await res.json();
                if (data.current_weather) {
                    const info = getWeatherInfo(data.current_weather.weathercode);
                    setWeather({
                        temp: Math.round(data.current_weather.temperature),
                        condition: info.label,
                        humidity: data.hourly?.relative_humidity_2m?.[0] || 75,
                        wind: data.current_weather.windspeed,
                        Icon: info.Icon,
                        iconColor: info.color,
                    });
                }
            } catch (err) {
                console.error("Weather fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) return (
        <div className="rb-weather loading">
            <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 100, height: 16, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 60, height: 40 }} />
        </div>
    );
    if (!weather) return <div className="rb-weather error">Weather unavailable</div>;

    const { Icon } = weather;

    return (
        <div className="rb-weather">
            <div className="rb-weather-icon">
                <Icon size={44} color={weather.iconColor} />
            </div>
            <div>
                <div className="rb-weather-info">
                    <div className="location">
                        <MapPin size={13} style={{ marginRight: 4 }} /> Cebu City, PH
                    </div>
                    <div className="condition">{weather.condition}</div>
                </div>
                <div className="rb-weather-temp">{weather.temp}°C</div>
                <div className="rb-weather-details">
                    <span><Droplets size={13} style={{ marginRight: 4 }} /> {weather.humidity}%</span>
                    <span><Wind size={13} style={{ marginRight: 4 }} /> {weather.wind} m/s</span>
                </div>
            </div>
            <div className="weather-forecast">
                {FORECAST_DAYS.map((day, i) => {
                    const FIcon = FORECAST_ICONS[i];
                    const temps = [0, -2, -3, +1, +2];
                    return (
                        <div key={day} className="forecast-day">
                            <div className="forecast-label">{day}</div>
                            <div className="forecast-icon"><FIcon size={16} /></div>
                            <div className="forecast-temp">{weather.temp + temps[i]}°</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ---- EARTHQUAKE WIDGET ----
const EarthquakeWidget = () => {
    const [quakes, setQuakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const fetchQuakes = async () => {
            try {
                const res = await fetch(
                    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
                );
                const data = await res.json();
                const filtered = data.features
                    .filter(f =>
                        f.properties.place.toLowerCase().includes("philippines") &&
                        f.properties.mag >= 4.0
                    )
                    .slice(0, 3)
                    .map(f => ({
                        mag: f.properties.mag.toFixed(1),
                        location: f.properties.place.replace(", Philippines", ""),
                        time: new Date(f.properties.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        level: f.properties.mag >= 6 ? "severe" : f.properties.mag >= 5 ? "moderate" : "light",
                        timestamp: f.properties.time,
                    }));

                const critical = filtered.find(
                    q => parseFloat(q.mag) >= 6.0 && Date.now() - q.timestamp < 21600000
                );
                if (critical) setAlert(critical);
                setQuakes(filtered);
            } catch (err) {
                console.error("Quake fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuakes();
    }, []);

    return (
        <div className="rb-quake-widget">
            <div className="rb-quake-header">
                <Globe size={16} style={{ marginRight: 7, color: "var(--color-3)" }} />
                Recent Earthquakes (Phils)
                <span className="philvocs-tag">USGS MAG 4+</span>
            </div>

            {alert && (
                <div className="rb-alert-urgent" style={{ marginBottom: 12 }}>
                    <Siren size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                    <div>
                        <strong>CRITICAL:</strong> Magnitude {alert.mag} earthquake in {alert.location}. Seek safety immediately.
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
                    ))}
                </div>
            ) : quakes.length > 0 ? (
                quakes.map((q, i) => (
                    <div key={i} className="rb-quake-item">
                        <div className={`rb-mag ${q.level}`}>{q.mag}</div>
                        <div className="rb-quake-info">
                            <div className="rb-quake-location">{q.location}</div>
                            <div className="rb-quake-meta">{q.time} · Mag {q.mag}</div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="rb-empty-small" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <ShieldCheck size={20} style={{ marginRight: 8, color: "var(--green-500)" }} />
                    No significant seismic activity
                </div>
            )}
            <div className="rb-quake-powered">Data: USGS Earthquake Hazards Program</div>
        </div>
    );
};

// ---- REPORT MODAL ----
const INCIDENT_TYPES = [
    { icon: <Waves size={22} />, label: "Flood" },
    { icon: <TreeDeciduous size={22} />, label: "Fallen Tree" },
    { icon: <Flame size={22} />, label: "Fire" },
    { icon: <Mountain size={22} />, label: "Landslide" },
    { icon: <LifeBuoy size={22} />, label: "Trapped Person" },
    { icon: <Zap size={22} />, label: "Power Outage" },
];

const URGENCY_CONFIG = {
    Low: { bars: 1, color: "low", desc: "Non-critical, monitor" },
    Medium: { bars: 2, color: "medium", desc: "Needs attention soon" },
    High: { bars: 3, color: "high", desc: "Immediate response needed" },
};

const UrgencyIndicator = ({ level }) => {
    const cfg = URGENCY_CONFIG[level] || URGENCY_CONFIG.Medium;
    return (
        <div className="urgency-indicator">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className={`urgency-bar${i <= cfg.bars ? ` filled ${cfg.color}` : ""}`}
                />
            ))}
        </div>
    );
};

const getResidentAddress = (residentUser) => {
    if (!residentUser) return "Location not set in profile";

    const city = residentUser.cityName || residentUser.city || "";
    const province = residentUser.provinceName || residentUser.province || "";
    const region = residentUser.regionName || residentUser.region || "";

    const detailedAddress = residentUser.address ||
        [residentUser.lotBlockNumber, residentUser.street].filter(Boolean).join(" ");

    const parts = [
        detailedAddress,
        residentUser.barangay,
        city,
        province,
        region,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "Location not set in profile";
};

const ReportModal = ({ onClose, onSuccess, residentUser }) => {
    const defaultLocation = getResidentAddress(residentUser);
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        incidentType: "Flood",
        urgency: "Medium",
        description: "",
        location: defaultLocation,
        latitude: 10.3157,
        longitude: 123.8854,
        photo: null,
    });

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setForm(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
            },
        });
        return form.latitude ? <Marker position={[form.latitude, form.longitude]} /> : null;
    };

    const handlePhotoChange = (e) => {
        if (e.target.files?.[0]) setForm({ ...form, photo: e.target.files[0] });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("incidentType", form.incidentType);
            formData.append("description", form.description);
            formData.append("location", form.location);
            formData.append("latitude", form.latitude);
            formData.append("longitude", form.longitude);
            formData.append("urgency", form.urgency);
            if (form.photo) formData.append("photo", form.photo);

            await submitReport(formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit report. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = step === 1 ? !!form.incidentType : step === 2 ? form.description.trim().length >= 10 : true;

    return (
        <div className="rb-modal-overlay" onClick={onClose}>
            <div className="rb-modal" onClick={e => e.stopPropagation()}>
                <div className="rb-modal-header">
                    <div className="rb-modal-title">
                        <Siren size={18} style={{ marginRight: 8 }} />
                        Submit Emergency Report
                    </div>
                    <button className="rb-btn rb-btn-ghost rb-btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="rb-modal-body">
                    {/* Progress Steps */}
                    <div className="modal-steps">
                        {[
                            { num: 1, label: "Incident" },
                            { num: 2, label: "Details" },
                            { num: 3, label: "Submit" },
                        ].map(s => (
                            <div
                                key={s.num}
                                className={`modal-step${step > s.num ? " done" : ""}${step === s.num ? " active" : ""}`}
                            >
                                <div className="step-dot">
                                    {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                                </div>
                                <div className="step-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Incident Type + Urgency */}
                    {step === 1 && (
                        <>
                            <div className="rb-form-group">
                                <label className="rb-label">Incident Type</label>
                                <div className="incident-type-grid">
                                    {INCIDENT_TYPES.map(t => (
                                        <div
                                            key={t.label}
                                            className={`incident-type-card${form.incidentType === t.label ? " active" : ""}`}
                                            onClick={() => setForm({ ...form, incidentType: t.label })}
                                        >
                                            <div className="card-icon">{t.icon}</div>
                                            <span>{t.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rb-form-group">
                                <label className="rb-label">Urgency Level</label>
                                <div className="rb-radio-group">
                                    {Object.entries(URGENCY_CONFIG).map(([u, cfg]) => (
                                        <div className="rb-radio-pill" key={u}>
                                            <input
                                                type="radio"
                                                name="urgency"
                                                id={`u-${u}`}
                                                checked={form.urgency === u}
                                                onChange={() => setForm({ ...form, urgency: u })}
                                            />
                                            <label htmlFor={`u-${u}`}>
                                                <span>{u}</span>
                                                <UrgencyIndicator level={u} />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {form.urgency && (
                                    <div style={{
                                        fontSize: 12,
                                        color: "var(--gray-500)",
                                        marginTop: 8,
                                        fontFamily: "var(--font-ui)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}>
                                        <AlertTriangle size={12} />
                                        {URGENCY_CONFIG[form.urgency]?.desc}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 2: Description, Photo, Location */}
                    {step === 2 && (
                        <>
                            <div className="rb-form-group">
                                <label className="rb-label">
                                    Description
                                    <span style={{ color: "var(--gray-400)", fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                                        (min. 10 characters)
                                    </span>
                                </label>
                                <textarea
                                    className="rb-textarea"
                                    placeholder="Describe what's happening, how many people are affected, and any immediate dangers..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                />
                                <div style={{ fontSize: 11, color: form.description.length < 10 ? "var(--red-400)" : "var(--green-500)", textAlign: "right", marginTop: 4, fontFamily: "var(--font-ui)" }}>
                                    {form.description.length} chars
                                </div>
                            </div>

                            <div className="rb-form-group">
                                <label className="rb-label">Photo Evidence <span style={{ color: "var(--gray-400)", fontWeight: 400, fontSize: 11 }}>(optional)</span></label>
                                <label className={`photo-upload-zone${form.photo ? " has-file" : ""}`}>
                                    <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
                                    <div className="photo-icon">
                                        {form.photo ? <CheckCircle2 size={36} color="var(--green-600)" /> : <Camera size={36} />}
                                    </div>
                                    <div className="photo-upload-text">
                                        {form.photo ? form.photo.name : "Click to upload or drag & drop"}
                                    </div>
                                    <div className="photo-upload-hint">PNG, JPG, WEBP up to 10MB</div>
                                </label>
                            </div>

                            <div className="rb-form-group">
                                <label className="rb-label">Location</label>
                                <div className="location-detect" style={{ marginBottom: 12 }}>
                                    <input
                                        className="rb-input"
                                        placeholder="Describe exact location..."
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                    />
                                    <button className="rb-btn rb-btn-secondary" style={{ flexShrink: 0 }}>
                                        <Navigation size={14} style={{ marginRight: 6 }} /> GPS
                                    </button>
                                </div>
                                <div style={{ height: 260, borderRadius: 10, overflow: 'hidden', border: "1.5px solid var(--gray-200)" }}>
                                    <MapContainer center={[10.3157, 123.8854]} zoom={14} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker />
                                    </MapContainer>
                                </div>
                                <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 8, textAlign: "center", fontFamily: "var(--font-ui)" }}>
                                    Click on the map to pin the exact emergency location.
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && (
                        <div className="confirm-panel">
                            <div className="confirm-icon">
                                <CheckCircle2 size={60} color="var(--green-600)" />
                            </div>
                            <h3>Ready to Submit</h3>
                            <p>Your emergency report will be sent immediately to Barangay Officials who will respond as soon as possible.</p>
                            <div className="confirm-details">
                                <div>
                                    <span className="detail-label">Type</span>
                                    <span>{form.incidentType}</span>
                                </div>
                                <div>
                                    <span className="detail-label">Urgency</span>
                                    <span className={`rb-badge ${form.urgency.toLowerCase()}`}>{form.urgency}</span>
                                    <UrgencyIndicator level={form.urgency} />
                                </div>
                                <div>
                                    <span className="detail-label">Location</span>
                                    <span>{form.location}</span>
                                </div>
                                {form.description && (
                                    <div style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                                        <span className="detail-label">Details</span>
                                        <span style={{ color: "var(--gray-600)", fontSize: 13, lineHeight: 1.5 }}>
                                            {form.description.slice(0, 100)}{form.description.length > 100 ? "..." : ""}
                                        </span>
                                    </div>
                                )}
                                {form.photo && (
                                    <div>
                                        <span className="detail-label">Photo</span>
                                        <span style={{ color: "var(--green-600)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                            <CheckCircle2 size={13} /> {form.photo.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="rb-modal-footer">
                    {step > 1 && (
                        <button className="rb-btn rb-btn-secondary" onClick={() => setStep(s => s - 1)}>
                            ← Back
                        </button>
                    )}
                    <div style={{ marginLeft: "auto" }}>
                        {step < 3 && (
                            <button
                                className="rb-btn rb-btn-primary"
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canProceed}
                                style={{ opacity: canProceed ? 1 : 0.5 }}
                            >
                                Continue →
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                className="rb-btn rb-btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <span>Sending...</span>
                                ) : (
                                    <><Siren size={16} style={{ marginRight: 8 }} /> Submit Report</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ---- DASHBOARD HOME ----
const DashboardHome = ({ onReport, stats, setActive, user }) => (
    <div>
        <div className="rb-alert-banner">
            <div className="alert-dot"></div>
            ACTIVE ALERT: Monitoring Barangay 76 Safety Status · Official Updates every 15m
        </div>

        <div className="rb-grid-2" style={{ marginBottom: 20 }}>
            <WeatherWidget />
            <EarthquakeWidget />
        </div>

        {/* Quick Actions */}
        <div className="rb-quick-actions">
            <div className="rb-quick-action emergency" onClick={onReport}>
                <div className="qa-icon"><LifeBuoy size={30} /></div>
                <div className="qa-label">Report Emergency</div>
            </div>
            <div className="rb-quick-action" onClick={() => setActive("evacuation")}>
                <div className="qa-icon"><Building2 size={30} /></div>
                <div className="qa-label">Evacuation Centers</div>
            </div>
            <div className="rb-quick-action" onClick={() => setActive("announcements")}>
                <div className="qa-icon"><Megaphone size={30} /></div>
                <div className="qa-label">View Alerts</div>
            </div>
            <div className="rb-quick-action" onClick={() => setActive("report")}>
                <div className="qa-icon"><ClipboardList size={30} /></div>
                <div className="qa-label">My Reports</div>
            </div>
        </div>

        {/* Stat Cards */}
        <div className="rb-stat-grid">
            <div className="rb-stat-card">
                <div className="rb-stat-icon red"><ClipboardList size={22} /></div>
                <div className="rb-stat-label">Active Reports</div>
                <div className="rb-stat-value">{stats.activeReports}</div>
                <div className="rb-stat-sub">Your submissions</div>
            </div>
            <div className="rb-stat-card amber">
                <div className="rb-stat-icon amber"><Radio size={22} /></div>
                <div className="rb-stat-label">System Alerts</div>
                <div className="rb-stat-value">{stats.alerts}</div>
                <div className="rb-stat-sub">Active broadcasts</div>
            </div>
            <div className="rb-stat-card green">
                <div className="rb-stat-icon green"><Building2 size={22} /></div>
                <div className="rb-stat-label">Nearest Center</div>
                <div className="rb-stat-value" style={{ fontSize: 16, marginTop: 6 }}>{stats.nearestCenter}</div>
                <div className="rb-stat-sub">Open & available</div>
            </div>
        </div>

        <div className="rb-grid-2">
            {/* Barangay Captain Card */}
            <div className="rb-card">
                <div className="rb-card-header">
                    <div className="rb-card-title">Barangay Captain</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="status-dot" />
                        <span style={{ fontSize: 11, color: "var(--green-600)", fontWeight: 700, fontFamily: "var(--font-ui)" }}>Online</span>
                    </div>
                </div>
                <div className="rb-card-body">
                    <div className="captain-card-inner">
                        <div className="captain-avatar">
                            {stats.captainName?.charAt(0) || "C"}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--gray-900)", fontFamily: "var(--font-display)" }}>
                                {stats.captainName}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--gray-500)", fontFamily: "var(--font-ui)", marginTop: 2 }}>
                                Barangay Captain · Brgy {user?.barangay || "Unknown"}
                            </div>
                            <div className="captain-detail">
                                <Phone size={13} color="var(--green-500)" />
                                <span>{stats.captainContact}</span>
                            </div>
                        </div>
                    </div>
                    <a href={`tel:${stats.captainContact}`} className="contact-call-btn">
                        <Phone size={13} />
                        Call Captain
                    </a>
                </div>
            </div>

            {/* Announcements Card */}
            <div className="rb-card">
                <div className="rb-card-header">
                    <div className="rb-card-title">Recent Announcements</div>
                    <button className="rb-btn rb-btn-ghost rb-btn-sm" onClick={() => { }}>
                        View All <ChevronRight size={14} />
                    </button>
                </div>
                <div className="rb-card-body" style={{ padding: "8px 20px" }}>
                    {[
                        { title: "Flood Preparedness Advisory", time: "1 hr ago", emergency: true, unread: true },
                        { title: "Community Clean Drive — Sat 8AM", time: "Yesterday", emergency: false, unread: true },
                        { title: "Barangay Meeting Schedule", time: "2 days ago", emergency: false, unread: false },
                    ].map((a, i) => (
                        <div
                            key={i}
                            className={`rb-announcement${a.emergency ? " emergency-alert" : ""}${a.unread ? " unread" : ""}`}
                        >
                            {a.unread && <div className="rb-unread-dot" />}
                            <div className="rb-announcement-title">
                                {a.emergency && <Siren size={14} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />}
                                {a.title}
                            </div>
                            <div className="rb-announcement-meta">
                                {a.emergency && <span className="rb-badge emergency">Emergency</span>}
                                <span><Clock size={11} style={{ marginRight: 3 }} />{a.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ---- MY REPORTS ----
const MyReports = ({ reports, onReport }) => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const filtered = reports.filter(r => {
        const matchSearch = r.incidentType?.toLowerCase().includes(search.toLowerCase()) ||
            r.location?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "All" || r.urgency === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div>
            <div className="rb-section-header">
                <div className="rb-section-title">My Reports</div>
                <button className="rb-btn rb-btn-primary rb-btn-sm" onClick={onReport}>
                    + New Report
                </button>
            </div>

            {reports.length > 0 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                    <div className="rb-search-bar" style={{ flex: 1, marginBottom: 0 }}>
                        <Search size={15} color="var(--gray-400)" />
                        <input
                            placeholder="Search by type or location..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", display: "flex" }} onClick={() => setSearch("")}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select
                        className="rb-filter-select"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option>All</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </div>
            )}

            <div className="rb-card">
                {reports.length === 0 ? (
                    <div className="rb-empty" style={{ padding: "48px 20px" }}>
                        <div className="rb-empty-icon"><ClipboardList size={44} /></div>
                        <div className="rb-empty-text">No reports submitted yet</div>
                        <div style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 20 }}>
                            Your emergency reports will appear here
                        </div>
                        <button onClick={onReport} className="rb-btn rb-btn-primary">
                            <Siren size={15} style={{ marginRight: 8 }} /> Submit First Report
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rb-empty" style={{ padding: 32 }}>
                        <div className="rb-empty-text">No reports match your search</div>
                    </div>
                ) : (
                    <div className="rb-table-wrap">
                        <table className="rb-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Urgency</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.id}>
                                        <td><code style={{ fontSize: 11 }}>#{r.id}</code></td>
                                        <td style={{ fontWeight: 600 }}>{r.incidentType}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <span className={`rb-badge ${r.urgency?.toLowerCase() || "medium"}`}>
                                                    {r.urgency || "Medium"}
                                                </span>
                                                <UrgencyIndicator level={r.urgency || "Medium"} />
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {r.location}
                                        </td>
                                        <td><span className="rb-badge pending">Active</span></td>
                                        <td style={{ color: "var(--gray-500)", fontSize: 12 }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button className="rb-btn rb-btn-secondary rb-btn-sm">Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getDistance = (lat1, lon1, lat2, lon2) => {
    if ((lat1 === lat2) && (lon1 === lon2)) return 0;
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    return dist * 1.609344;
};

function getCenterStatus(occ, cap) {
    if (cap === 0) return { label: "Closed", cls: "full", barCls: "full" };
    const pct = occ / cap;
    if (pct >= 0.9) return { label: "Full", cls: "full", barCls: "full" };
    if (pct >= 0.6) return { label: "Limited Space", cls: "limited", barCls: "moderate" };
    return { label: "Open", cls: "open", barCls: "available" };
}

const EvacuationCenters = () => {
    const [centers, setCenters] = useState([]);
    const [userLoc, setUserLoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState("province");

    useEffect(() => {
        const fetchRemote = async () => {
            setLoading(true);
            try {
                const data = await getScopedEvacuationCenters(scope);
                setCenters(data);
            } catch (err) {
                console.error("Failed to load centers", err);
                setCenters([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRemote();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => console.error("Geolocation error:", err),
                { enableHighAccuracy: true }
            );
        }
    }, [scope]);

    const isAvailableCenter = (center) => {
        const capacity = Number(center.capacity || 0);
        const currentOccupancy = Number(center.currentOccupancy || 0);
        return center.status !== "Closed" && capacity > 0 && currentOccupancy < capacity;
    };

    const centersWithDist = centers.map(c => {
        let dist = Infinity;
        if (userLoc) {
            dist = getDistance(userLoc.lat, userLoc.lng, c.latitude, c.longitude);
        }
        return { ...c, distance: dist };
    }).sort((a, b) => {
        const aRank = isAvailableCenter(a) ? 0 : 1;
        const bRank = isAvailableCenter(b) ? 0 : 1;
        if (aRank !== bRank) return aRank - bRank;
        return a.distance - b.distance;
    });

    const totalOcc = centers.reduce((a, c) => a + (c.currentOccupancy || 0), 0);
    const totalCap = centers.reduce((a, c) => a + (c.capacity || 0), 0);
    const nearestAvailable = centersWithDist.find(isAvailableCenter) || centersWithDist[0];

    return (
        <div>
            <div className="rb-section-header">
                <div className="rb-section-title">Evacuation Centers</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "inline-flex", border: "1px solid var(--gray-200)", borderRadius: 8, overflow: "hidden" }}>
                        <button
                            className="rb-btn rb-btn-ghost rb-btn-sm"
                            onClick={() => setScope("province")}
                            style={{ borderRadius: 0, background: scope === "province" ? "var(--blue-50)" : "transparent", color: scope === "province" ? "var(--blue-700)" : "var(--gray-600)" }}
                        >
                            Province-wide
                        </button>
                        <button
                            className="rb-btn rb-btn-ghost rb-btn-sm"
                            onClick={() => setScope("barangay")}
                            style={{ borderRadius: 0, background: scope === "barangay" ? "var(--blue-50)" : "transparent", color: scope === "barangay" ? "var(--blue-700)" : "var(--gray-600)", borderLeft: "1px solid var(--gray-200)" }}
                        >
                            My Barangay
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gray-500)", fontFamily: "var(--font-ui)" }}>
                        <Users size={14} />
                        {totalOcc} / {totalCap} total occupancy
                    </div>
                </div>
            </div>

            <div style={{ height: 300, borderRadius: 14, overflow: 'hidden', border: "1.5px solid var(--gray-200)", marginBottom: 20 }}>
                <MapContainer center={[10.3090, 123.8900]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {centersWithDist.map(c => (
                        <Marker key={c.id} position={[c.latitude, c.longitude]} />
                    ))}
                </MapContainer>
            </div>

            {userLoc && nearestAvailable && nearestAvailable.distance !== Infinity && (
                <div style={{ marginBottom: 16, padding: 12, background: "var(--blue-50)", border: "1px solid var(--blue-200)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--blue-700)", fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 600 }}>
                    <Navigation size={16} />
                    Nearest Available Center: {nearestAvailable.name} ({nearestAvailable.distance.toFixed(2)} km)
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {loading && <div style={{ textAlign: "center", padding: 20, color: "var(--gray-500)" }}>Loading evacuation network...</div>}

                {!loading && centersWithDist.length === 0 && (
                    <div style={{ textAlign: "center", padding: 20, color: "var(--gray-500)" }}>
                        No evacuation centers found for this scope.
                    </div>
                )}

                {centersWithDist.map((c, i) => {
                    const status = getCenterStatus(c.currentOccupancy, c.capacity);
                    const pct = c.capacity ? Math.round((c.currentOccupancy / c.capacity) * 100) : 0;
                    return (
                        <div key={i} className="rb-card">
                            <div className="evacuation-card-inner">
                                <div className="evac-info">
                                    <div className="evac-name">{c.name}</div>
                                    <div className="evac-meta">
                                        {c.provinceName && (
                                            <div className="evac-contact">
                                                <MapPin size={11} /> {c.barangayName || "Unknown Barangay"}, {c.provinceName}
                                            </div>
                                        )}
                                        {userLoc && c.distance !== Infinity && (
                                            <div className="evac-address" style={{ color: "var(--blue-600)", fontWeight: 600 }}>
                                                <Navigation size={11} /> {c.distance.toFixed(2)} km away
                                            </div>
                                        )}
                                        <div className="evac-contact">
                                            <MapPin size={11} /> Pin: {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <span className={`evac-status-badge ${c.status === "Closed" ? "full" : status.cls}`}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                                            {c.status === "Closed" ? "Closed" : status.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="evac-stats">
                                    <div className="evac-capacity">
                                        <div className="cap-label">Occupancy</div>
                                        <div className="cap-value">{c.currentOccupancy} / {c.capacity}</div>
                                        <div className="cap-bar">
                                            <div
                                                className={`cap-fill ${c.status === "Closed" ? "full" : status.barCls}`}
                                                style={{ width: `${Math.min(pct, 100)}%`, background: c.status === "Closed" ? "var(--gray-400)" : undefined }}
                                            />
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--gray-400)", textAlign: "right", marginTop: 3, fontFamily: "var(--font-ui)" }}>
                                            {pct}% capacity
                                        </div>
                                    </div>
                                    <button
                                        className="rb-btn rb-btn-primary rb-btn-sm"
                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`, '_blank')}
                                    >
                                        <Navigation size={13} style={{ marginRight: 4 }} /> Directions
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ---- ANNOUNCEMENTS ----
const ANNOUNCEMENTS = [
    {
        title: "TYPHOON WARNING: Prepare Evacuation Bags",
        body: "Barangay Officials advise all residents to prepare emergency kits with 3-day supplies. Evacuation may commence by 6PM if Typhoon Signal #2 is raised.",
        time: "1 hr ago",
        timestamp: new Date(Date.now() - 3600000),
        emergency: true,
        unread: true,
        author: "Brgy Captain"
    },
    {
        title: "Community Flood Preparedness Seminar",
        body: "Join us Saturday, Feb 24 at the Barangay Hall for a free seminar on flood preparedness and evacuation procedures.",
        time: "3 hrs ago",
        timestamp: new Date(Date.now() - 10800000),
        emergency: false,
        unread: true,
        author: "DRRMC"
    },
    {
        title: "Barangay Clean-Up Drive Results",
        body: "Thank you to all 200+ volunteers who participated in last Saturday's clean-up drive! Together we collected over 500kg of waste.",
        time: "Yesterday",
        emergency: false,
        unread: false,
        author: "Brgy Secretary"
    },
    {
        title: "Updated Evacuation Routes Posted",
        body: "New evacuation route maps have been posted at the barangay bulletin board and online portal. Please familiarize yourself with the nearest route.",
        time: "2 days ago",
        emergency: false,
        unread: false,
        author: "DRRMC"
    },
];

const Announcements = () => {
    const [filter, setFilter] = useState("All");
    const [expanded, setExpanded] = useState(null);

    const filtered = ANNOUNCEMENTS.filter(a =>
        filter === "All" ? true : filter === "Emergency" ? a.emergency : !a.emergency
    );

    return (
        <div>
            <div className="rb-section-header">
                <div className="rb-section-title">Announcements</div>
                <select
                    className="rb-filter-select"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option>All</option>
                    <option>Emergency</option>
                    <option>General</option>
                </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((a, i) => (
                    <div
                        key={i}
                        className={`rb-announcement${a.emergency ? " emergency-alert" : ""}${a.unread ? " unread" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                        {a.unread && <div className="rb-unread-dot" />}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div className="rb-announcement-title">
                                {a.emergency && <Siren size={15} style={{ marginRight: 6, display: "inline", verticalAlign: "middle" }} />}
                                {a.title}
                                {a.unread && <span className="rb-badge responding" style={{ fontSize: 9, marginLeft: 8 }}>New</span>}
                            </div>
                            <ChevronRight
                                size={16}
                                style={{
                                    flexShrink: 0,
                                    color: "var(--gray-400)",
                                    transition: "transform 0.2s",
                                    transform: expanded === i ? "rotate(90deg)" : "none"
                                }}
                            />
                        </div>
                        {expanded === i && (
                            <div className="rb-announcement-body">{a.body}</div>
                        )}
                        <div className="rb-announcement-meta">
                            {a.emergency && <span className="rb-badge emergency">Emergency</span>}
                            {a.author && (
                                <span style={{ fontSize: 11, color: "var(--gray-400)" }}>
                                    <Users size={11} style={{ marginRight: 3 }} />{a.author}
                                </span>
                            )}
                            <span><Clock size={11} style={{ marginRight: 3 }} />{a.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ---- HOTLINES ----
const HOTLINES = [
    { title: "National Emergency", number: "911", icon: <Siren size={20} />, color: "var(--red-600)", desc: "Universal emergency service now in place nationwide", priority: true },
    { title: "Police (PNP)", number: "117", icon: <ShieldCheck size={20} />, color: "var(--blue-600)", desc: "Police-specific line still widely listed" },
    { title: "Fire (BFP)", number: "(02) 8426-0219", icon: <Flame size={20} />, color: "var(--red-500)", desc: "Direct fire line (but 911 should be primary)" },
    { title: "Red Cross", number: "143", icon: <LifeBuoy size={20} />, color: "var(--red-700)", desc: "PRC assistance and response" },
    { title: "Disaster (NDRRMC)", number: "(02) 8911-1406", icon: <AlertTriangle size={20} />, color: "var(--amber-600)", desc: "Disaster management coordination center" },
    { title: "Coast Guard", number: "(02) 8527-8481", icon: <Waves size={20} />, color: "var(--blue-700)", desc: "Maritime emergencies" },
    { title: "MMDA", number: "136", icon: <Navigation size={20} />, color: "var(--green-600)", desc: "Traffic/rescue in Metro Manila" },
    { title: "Health (DOH)", number: "1555", icon: <Heart size={20} />, color: "var(--green-700)", desc: "Public health info, not direct emergency ambulances" },
];

const Hotlines = () => {
    return (
        <div>
            <style>{`
                .hotlines-section-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .hotlines-title-group {}

                .hotlines-eyebrow {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.14em;
                    color: var(--gray-400);
                    font-family: var(--font-ui);
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .hotlines-eyebrow::before {
                    content: '';
                    display: inline-block;
                    width: 14px;
                    height: 2px;
                    background: var(--red-500);
                    border-radius: 2px;
                }

                .hotlines-heading {
                    font-family: var(--font-display);
                    font-size: 22px;
                    font-weight: 900;
                    color: var(--gray-900);
                    letter-spacing: -0.02em;
                    line-height: 1;
                }

                .hotlines-sub {
                    font-size: 12.5px;
                    color: var(--gray-400);
                    font-family: var(--font-ui);
                    font-weight: 500;
                }

                /* ── Grid ── */
                .hotlines-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                @media (max-width: 640px) {
                    .hotlines-grid { grid-template-columns: 1fr; }
                }

                /* ── Card ── */
                .hotline-card {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 0;
                    border-radius: 12px;
                    background: var(--white, #fff);
                    border: 1.5px solid var(--gray-150, #efefef);
                    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
                    overflow: hidden;
                    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
                    position: relative;
                    cursor: default;
                    animation: cardReveal 0.35s ease both;
                }

                @keyframes cardReveal {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .hotline-card:hover {
                    box-shadow: 0 6px 20px rgba(0,0,0,0.09);
                    transform: translateY(-2px);
                }

                /* Color left bar */
                .hotline-card-bar {
                    width: 4px;
                    align-self: stretch;
                    flex-shrink: 0;
                    transition: width 0.18s;
                }

                .hotline-card:hover .hotline-card-bar {
                    width: 5px;
                }

                /* Priority glow for 911 */
                .hotline-card.priority {
                    border-color: rgba(220, 38, 38, 0.22);
                    background: linear-gradient(135deg, #fff 80%, rgba(220,38,38,0.03));
                }

                .hotline-card.priority:hover {
                    border-color: rgba(220, 38, 38, 0.35);
                    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.12);
                }

                .hotline-card-inner {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex: 1;
                    padding: 14px 16px 14px 12px;
                    min-width: 0;
                }

                /* Icon */
                .hotline-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: transform 0.18s;
                }

                .hotline-card:hover .hotline-icon {
                    transform: scale(1.08);
                }

                /* Content */
                .hotline-content {
                    flex: 1;
                    min-width: 0;
                }

                .hotline-card-title {
                    font-size: 10.5px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    color: var(--gray-400);
                    font-family: var(--font-ui);
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .hotline-number {
                    font-family: var(--font-display);
                    font-size: 22px;
                    font-weight: 900;
                    letter-spacing: -0.03em;
                    line-height: 1;
                    margin-bottom: 3px;
                    transition: letter-spacing 0.18s;
                }

                .hotline-card:hover .hotline-number {
                    letter-spacing: -0.01em;
                }

                .hotline-desc {
                    font-size: 11px;
                    color: var(--gray-400);
                    font-family: var(--font-ui);
                    line-height: 1.45;
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Call button */
                .hotline-call-btn {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    font-family: var(--font-ui);
                    white-space: nowrap;
                    text-decoration: none;
                    border: 1.5px solid var(--gray-200);
                    color: var(--gray-600);
                    background: white;
                    transition: all 0.15s;
                    margin-right: 14px;
                    flex-shrink: 0;
                }

                .hotline-call-btn:hover {
                    border-color: currentColor;
                    transform: translateY(-1px);
                    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                }

                /* staggered animation delay */
                .hotline-card:nth-child(1)  { animation-delay: 0.03s; }
                .hotline-card:nth-child(2)  { animation-delay: 0.06s; }
                .hotline-card:nth-child(3)  { animation-delay: 0.09s; }
                .hotline-card:nth-child(4)  { animation-delay: 0.12s; }
                .hotline-card:nth-child(5)  { animation-delay: 0.15s; }
                .hotline-card:nth-child(6)  { animation-delay: 0.18s; }
                .hotline-card:nth-child(7)  { animation-delay: 0.21s; }
                .hotline-card:nth-child(8)  { animation-delay: 0.24s; }
            `}</style>

            {/* Header */}
            <div className="hotlines-section-header">
                <div className="hotlines-title-group">
                    <div className="hotlines-eyebrow">Philippines National</div>
                    <div className="hotlines-heading">Emergency Hotlines</div>
                </div>
                <div className="hotlines-sub">Keep these numbers saved</div>
            </div>

            {/* Grid */}
            <div className="hotlines-grid">
                {HOTLINES.map((h, i) => (
                    <div
                        key={i}
                        className={`hotline-card${h.priority ? " priority" : ""}`}
                        onMouseEnter={e => {
                            const btn = e.currentTarget.querySelector(".hotline-call-btn");
                            if (btn) {
                                btn.style.background = h.color;
                                btn.style.color = "white";
                                btn.style.borderColor = "transparent";
                            }
                        }}
                        onMouseLeave={e => {
                            const btn = e.currentTarget.querySelector(".hotline-call-btn");
                            if (btn) {
                                btn.style.background = "white";
                                btn.style.color = "";
                                btn.style.borderColor = "";
                            }
                        }}
                    >
                        {/* Left color bar */}
                        <div className="hotline-card-bar" style={{ background: h.color }} />

                        <div className="hotline-card-inner">
                            {/* Icon */}
                            <div
                                className="hotline-icon"
                                style={{
                                    background: `color-mix(in srgb, ${h.color} 12%, transparent)`,
                                    color: h.color,
                                }}
                            >
                                {h.icon}
                            </div>

                            {/* Text */}
                            <div className="hotline-content">
                                <div className="hotline-card-title">{h.title}</div>
                                <div className="hotline-number" style={{ color: h.color }}>{h.number}</div>
                                <div className="hotline-desc">{h.desc}</div>
                            </div>
                        </div>

                        {/* Call button */}
                        <a
                            href={`tel:${h.number.replace(/[^0-9+]/g, "")}`}
                            className="hotline-call-btn"
                            style={{ "--btn-color": h.color }}
                            onClick={e => e.stopPropagation()}
                        >
                            <Phone size={13} />
                            Call
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ---- COMMUNITY DIRECTORY ----
const CommunityDirectory = () => {
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDirectory = async () => {
            try {
                const res = await getCommunityDirectory();
                // Sort the directory data
                const sorted = [...res.data].sort((a, b) => {
                    // If same role, sort alphabetically by name
                    return a.fullName?.localeCompare(b.fullName || '') || 0;
                });
                setDirectory(sorted);
            } catch (err) {
                console.error("Error fetching directory:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDirectory();
    }, []);

    if (loading) return <div className="rb-loading">Loading directory...</div>;

    const formatRoleDisplay = (role) => {
        const roleMap = {
            'BARANGAY CAPTAIN': 'Barangay Captain',
            'TANOD': 'Tanod',
            'OFFICIAL': 'Official',
            'VOLUNTEER': 'Volunteer',
            'RESIDENT': 'Resident',
        };
        return roleMap[role?.toUpperCase()] || role || 'Resident';
    };

    const getRoleColor = (role) => {
        const upperRole = role?.toUpperCase();
        if (upperRole === 'BARANGAY CAPTAIN') return 'var(--red-600)';
        if (upperRole === 'TANOD' || upperRole === 'OFFICIAL') return 'var(--blue-600)';
        return 'var(--gray-500)';
    };

    // Group residents by category
    const barangayCaptain = directory.filter(u => u.role?.toUpperCase() === 'BARANGAY CAPTAIN');
    const barangayOfficials = directory.filter(u => {
        const role = u.role?.toUpperCase();
        return role === 'TANOD' || role === 'OFFICIAL';
    });
    const residents = directory.filter(u => {
        const role = u.role?.toUpperCase();
        return role !== 'BARANGAY CAPTAIN' && role !== 'TANOD' && role !== 'OFFICIAL';
    });

    const DirectorySection = ({ title, data }) => (
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)", marginBottom: 12 }}>
                {title}
            </div>
            <div className="rb-card">
                <div className="rb-table-wrap">
                    <table className="rb-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Purok</th>
                                <th>Role</th>
                                <th>Badge</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", padding: "24px", color: "var(--gray-400)", fontSize: 13 }}>
                                        No members in this category.
                                    </td>
                                </tr>
                            ) : (
                                data.map((d, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 700, color: "var(--gray-900)" }}>{d.fullName}</td>
                                        <td>{d.purok || "N/A"}</td>
                                        <td>
                                            <span style={{
                                                fontSize: 11,
                                                textTransform: "uppercase",
                                                fontWeight: 800,
                                                color: getRoleColor(d.role)
                                            }}>
                                                {formatRoleDisplay(d.role)}
                                            </span>
                                        </td>
                                        <td>
                                            {d.verified ? (
                                                <span className="rb-badge resolved" style={{ fontSize: 10 }}>Verified Resident</span>
                                            ) : (
                                                <span className="rb-badge pending" style={{ fontSize: 10 }}>Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="rb-section-header">
                <div>
                    <div className="rb-section-title">Community Directory</div>
                    <div style={{ fontSize: 13, color: "var(--gray-500)", fontFamily: "var(--font-ui)", marginTop: 4 }}>
                        Complete list of all residents in your barangay.
                    </div>
                </div>
            </div>

            {directory.length === 0 ? (
                <div className="rb-card" style={{ textAlign: "center", padding: "40px", color: "var(--gray-400)" }}>
                    No residents found in your barangay.
                </div>
            ) : (
                <>
                    <DirectorySection title="Barangay Captain" data={barangayCaptain} />
                    <DirectorySection title="Barangay Officials" data={barangayOfficials} />
                    <DirectorySection title="Residents" data={residents} />
                </>
            )}

            <div style={{ marginTop: 24, padding: 16, background: "var(--blue-50)", borderRadius: 12, border: "1px solid var(--blue-100)", display: "flex", gap: 12 }}>
                <ShieldCheck size={20} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: "var(--blue-800)", lineHeight: 1.5 }}>
                    <strong>Privacy Notice:</strong> This directory only displays names, puroks, and roles of neighbors who chose to share them. All other sensitive data is hidden according to NPC privacy principles.
                </div>
            </div>
        </div>
    );
};

// ---- PROFILE (moved to Settings component) ----

// ---- MAIN EXPORT ----
export default function DashboardResident({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const active = queryParams.get("tab") || "dashboard";
    const setActive = (tab) => navigate(`/dashboard?tab=${tab}`);

    const [isModalOpen, setModalOpen] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        activeReports: 0,
        alerts: 2,
        nearestCenter: "Brgy Hall",
        captainName: "Loading...",
        captainContact: "Loading...",
    });

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    };

    const fetchData = async () => {
        try {
            const [reportsRes, dashboardRes] = await Promise.all([
                getReports(),
                getDashboardData(),
            ]);
            setReports(reportsRes.data);
            setStats({
                activeReports: reportsRes.data.length,
                alerts: dashboardRes.data.weatherAlerts?.length || 0,
                nearestCenter: dashboardRes.data.evacuationCenters?.[0]?.name || "Brgy Hall",
                captainName: dashboardRes.data.captainName || "Pending Verification",
                captainContact: dashboardRes.data.captainContact || "N/A",
            });
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (user && user.onboardingCompleted !== true && user.onboardingCompleted !== "true") {
            setShowOnboarding(true);
        }
    }, [user]);

    const openReport = () => setModalOpen(true);

    const screens = {
        dashboard: <DashboardHome onReport={openReport} stats={stats} setActive={setActive} user={user} />,
        report: <MyReports reports={reports} onReport={openReport} />,
        evacuation: <EvacuationCenters />,
        announcements: <Announcements />,
        settings: <Settings user={user} />,
        hotlines: <Hotlines />,
        directory: <CommunityDirectory />,
    };

    const titles = {
        dashboard: "Resident Dashboard",
        report: "Emergency Reports",
        evacuation: "Evacuation Centers",
        announcements: "Announcements",
        settings: "Settings",
        hotlines: "Emergency Hotlines",
        directory: "Community Directory",
    };

    const subtitles = {
        dashboard: "System overview, recent activity, and quick statistics",
        report: "Submit, track, and manage incident reports in your barangay",
        evacuation: "Find safe centers, check capacity, and monitor center status",
        announcements: "Receive advisories, warnings, and barangay-wide notices",
        settings: "Manage profile, account preferences, and app configuration",
        hotlines: "Quick access to emergency response contact numbers",
        directory: "View verified residents and officials in your barangay",
    };

    const currentTitle = titles[active] || titles.dashboard;
    const currentSubtitle = subtitles[active] || subtitles.dashboard;

    return (
        <div className="dashboard-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="rb-header" style={{ marginBottom: '20px', borderRadius: '12px', height: 'auto', minHeight: 72, paddingTop: 10, paddingBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rb-header-title">{currentTitle}</div>
                    <div className="rb-header-sub">{currentSubtitle}</div>
                </div>
                <div className="rb-header-actions">
                    <div className="rb-notif-bell">
                        <Bell size={20} />
                        <div className="rb-notif-count">{stats.alerts || 0}</div>
                    </div>
                </div>
            </header>



            <div className="rb-content">
                {screens[active]}
            </div>

            {isModalOpen && <ReportModal onClose={() => setModalOpen(false)} onSuccess={fetchData} residentUser={user} />}

            <OnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
                user={user}
            />

            <LogoutModal
                show={showLogout}
                onClose={() => setShowLogout(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}

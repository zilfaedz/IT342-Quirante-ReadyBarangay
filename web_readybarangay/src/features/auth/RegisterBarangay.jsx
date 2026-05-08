import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import {
    ArrowRight, ArrowLeft, Check, Lock,
    Mail, Smartphone, User, Eye, EyeOff, Star, ShieldCheck
} from "lucide-react";
import logo from "../../assets/ReadyBarangay_Logo.png";
import "./Register.css"; // Reuse existing styles
import PhilippineLocationSelector from "../../shared/location/PhilippineLocationSelector";

const steps = [
    { num: 1, label: "Captain's Details" },
    { num: 2, label: "Additional Details" },
    { num: 3, label: "Barangay Information" },
    { num: 4, label: "Verification Documents" },
];

export default function RegisterBarangay() {
    const { registerCaptain } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        role: "Barangay Captain",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        barangay: "",
        barangayCode: "",
        cityName: "",
        cityCode: "",
        provinceName: "",
        provinceCode: "",
        regionName: "",
        regionCode: "",
        street: "",
        lotBlockNumber: "",
        gender: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactPhone: "",
        bloodType: "",
        agree: false,
    });
    const [files, setFiles] = useState({
        governmentId: null,
        certificateOfAppointment: null,
        barangayResolution: null,
        selfie: null
    });
    const [showPass, setShowPass] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleLocationChange = useCallback((loc) => {
        setForm(f => ({
            ...f,
            regionName: loc.region.name,
            regionCode: loc.region.code,
            provinceName: loc.province.name,
            provinceCode: loc.province.code,
            cityName: loc.city.name,
            cityCode: loc.city.code,
            barangay: loc.barangay.name,
            barangayCode: loc.barangay.code
        }));
    }, []);

    const handleNext = () => {
        if (step === 1) {
            if (!form.firstName) {
                setError("Please provide your First Name.");
                return;
            }
            if (!form.lastName) {
                setError("Please provide your Last Name.");
                return;
            }
            if (!form.dateOfBirth) {
                setError("Please provide a valid Date of Birth (ensure the year is complete).");
                return;
            }
            if (!form.email) {
                setError("Please provide your Official Email.");
                return;
            }
            if (!form.phone) {
                setError("Please provide your Mobile Number.");
                return;
            }
            if (!form.password) {
                setError("Please provide a Portal Password.");
                return;
            }
            if (!form.confirmPassword) {
                setError("Please confirm your password.");
                return;
            }
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }
        if (step === 3) {
            if (!form.barangayCode) {
                setError("Please select a valid barangay.");
                return;
            }
        }
        setError("");
        setStep((s) => Math.min(s + 1, 4));
    };

    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!files.governmentId || !files.certificateOfAppointment || !files.selfie) {
            setError("Please upload all required verification documents.");
            return;
        }

        if (!form.agree) {
            setError("You must agree to the terms.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append('name', `${form.firstName} ${form.lastName}`.trim());
            formData.append('email', form.email);
            formData.append('password', form.password);
            formData.append('dateOfBirth', form.dateOfBirth);
            formData.append('phone', form.phone);
            formData.append('gender', form.gender);
            formData.append('emergencyContactName', form.emergencyContactName);
            formData.append('emergencyContactRelationship', form.emergencyContactRelationship);
            formData.append('emergencyContactPhone', form.emergencyContactPhone);
            formData.append('bloodType', form.bloodType);

            formData.append('barangayCode', form.barangayCode);
            formData.append('barangay', form.barangay);
            formData.append('cityName', form.cityName);
            formData.append('cityCode', form.cityCode);
            formData.append('provinceName', form.provinceName);
            formData.append('provinceCode', form.provinceCode);
            formData.append('regionName', form.regionName);
            formData.append('regionCode', form.regionCode);

            if (files.governmentId) formData.append('governmentId', files.governmentId);
            if (files.certificateOfAppointment) formData.append('certificateOfAppointment', files.certificateOfAppointment);
            if (files.barangayResolution) formData.append('barangayResolution', files.barangayResolution);
            if (files.selfie) formData.append('selfie', files.selfie);

            const result = await registerCaptain(formData);

            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.message || "Registration failed. This barangay may already have an approved captain.");
            }
        } catch (err) {
            setError("An error occurred during registration.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page reg-page">
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
                <div className="auth-ring auth-ring-1" />
                <div className="auth-ring auth-ring-2" />

                <nav className="auth-nav">
                    <a href="/" className="auth-nav-logo">
                        <div className="auth-nav-logo-icon">
                            <img src={logo} alt="Logo" className="auth-logo-img" />
                        </div>
                        <span className="auth-nav-logo-text">Ready<span>Barangay</span></span>
                    </a>
                </nav>

                <div className="reg-success-wrap">
                    <div className="reg-success-card">
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <img src={logo} alt="ReadyBarangay Logo" style={{ width: '80px', height: 'auto' }} />
                        </div>
                        <div className="reg-success-icon"><ShieldCheck size={64} color="var(--color-primary)" /></div>
                        <h2 className="reg-success-title">Registration Submitted!</h2>
                        <p className="reg-success-sub">
                            Your application is now under review for verification. We will check your submitted documents and notify you once your Captain account is approved.
                        </p>
                        <button onClick={() => navigate("/login")} className="auth-submit-btn">
                            Return to Login <ArrowRight size={18} style={{ marginLeft: 8 }} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page reg-page">
            <div className="auth-orb auth-orb-1" style={{ background: 'var(--color-primary-light)' }} />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-ring auth-ring-1" />
            <div className="auth-ring auth-ring-2" />

            <nav className="auth-nav">
                <a href="/" className="auth-nav-logo">
                    <div className="auth-nav-logo-icon">
                        <img src={logo} alt="Logo" className="auth-logo-img" />
                    </div>
                    <span className="auth-nav-logo-text">Ready<span>Barangay</span></span>
                </a>
            </nav>

            <div className="reg-layout">
                <div className="auth-left reg-left">
                    <div className="auth-left-inner">
                        <div className="auth-eyebrow">Official Registration</div>
                        <h1 className="auth-banner-title">
                            Register Your<br />Barangay as<br /><span className="t-amber">Lead</span><br /><span className="t-red">Captain.</span>
                        </h1>
                        <p className="auth-banner-sub">
                            Take charge of your community's safety. Registering your barangay allows you to
                            manage emergency alerts, coordinate responders, and protect your residents.
                        </p>

                        <div className="reg-step-sidebar">
                            {steps.map((s, i) => (
                                <div key={s.num} className={`reg-step-item${step === s.num ? " active" : ""}${step > s.num ? " done" : ""}`}>
                                    <div className="reg-step-bubble" style={{ borderColor: step >= s.num ? 'var(--color-primary)' : '' }}>
                                        {step > s.num ? <Check size={16} /> : s.num}
                                    </div>
                                    <div className="reg-step-info">
                                        <div className="reg-step-label">{s.label}</div>
                                        <div className="reg-step-status">
                                            {step > s.num ? "Completed" : step === s.num ? "In Progress" : "Pending"}
                                        </div>
                                    </div>
                                    {i < steps.length - 1 && <div className="reg-step-line" />}
                                </div>
                            ))}
                        </div>

                        <div className="auth-badge-row">
                            <div className="auth-badge"><Star size={14} style={{ marginRight: 6 }} /> Official Account</div>
                            <div className="auth-badge">Barangay Lead</div>
                            <div className="auth-badge"><ShieldCheck size={14} style={{ marginRight: 6 }} /> Command Access</div>
                        </div>
                    </div>
                </div>

                <div className="auth-right reg-right">
                    <div className="auth-card reg-card">
                        <div className="reg-progress-bar">
                            <div
                                className="reg-progress-fill"
                                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%`, background: 'var(--color-primary)' }}
                            />
                        </div>

                        <div className="auth-card-header">
                            <div className="auth-card-icon">
                                <img src={logo} alt="Logo" className="auth-logo-img" />
                            </div>
                            <h2 className="auth-card-title">
                                {step === 1 && "Captain's Profile"}
                                {step === 2 && "Additional Details"}
                                {step === 3 && "Register Barangay"}
                                {step === 4 && "Verification Documents"}
                            </h2>
                            <p className="auth-card-sub">
                                {step === 1 && "Start by creating your official captain account"}
                                {step === 2 && "Provide gender, blood type, and emergency contact"}
                                {step === 3 && "Enter your barangay location to initialize the system"}
                                {step === 4 && "Upload necessary documents for verification"}
                            </p>
                            {error && <div className="auth-error-message" style={{ color: 'var(--color-3)', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>{error}</div>}
                        </div>

                        {step === 1 && (
                            <div className="auth-form">
                                <div className="reg-name-row">
                                    <div className="auth-field-group">
                                        <label className="auth-label">First Name</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon"><User size={16} /></span>
                                            <input
                                                type="text"
                                                className="auth-input"
                                                placeholder="Juan"
                                                value={form.firstName}
                                                onChange={(e) => update("firstName", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="auth-field-group">
                                        <label className="auth-label">Last Name</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon"><User size={16} /></span>
                                            <input
                                                type="text"
                                                className="auth-input"
                                                placeholder="dela Cruz"
                                                value={form.lastName}
                                                onChange={(e) => update("lastName", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Date of Birth</label>
                                    <div className="auth-input-wrap">
                                        <input
                                            type="date"
                                            className="auth-input"
                                            value={form.dateOfBirth}
                                            onChange={(e) => update("dateOfBirth", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Official Email</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-input-icon"><Mail size={16} /></span>
                                        <input
                                            type="email"
                                            className="auth-input"
                                            placeholder="captain.juan@barangay.ph"
                                            value={form.email}
                                            onChange={(e) => update("email", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Mobile Number</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-input-icon"><Smartphone size={16} /></span>
                                        <input
                                            type="tel"
                                            className="auth-input"
                                            placeholder="+63 917 000 0000"
                                            value={form.phone}
                                            onChange={(e) => update("phone", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Portal Password</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-input-icon"><Lock size={16} /></span>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            className="auth-input"
                                            placeholder="Create a strong password"
                                            value={form.password}
                                            onChange={(e) => update("password", e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="auth-eye-btn"
                                            onClick={() => setShowPass(!showPass)}
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Confirm Password</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-input-icon"><Lock size={16} /></span>
                                        <input
                                            type="password"
                                            className="auth-input"
                                            placeholder="Repeat password"
                                            value={form.confirmPassword}
                                            onChange={(e) => update("confirmPassword", e.target.value)}
                                        />
                                    </div>
                                </div>

                            </div>
                        )}

                        {step === 2 && (
                            <div className="auth-form">
                                <div className="auth-field-row">
                                    <div className="auth-field-group">
                                        <label className="auth-label">Gender</label>
                                        <div className="auth-input-wrap">
                                            <select
                                                className="auth-input"
                                                value={form.gender}
                                                onChange={(e) => update("gender", e.target.value)}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other / Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="auth-field-group">
                                        <label className="auth-label">Blood Type (Optional)</label>
                                        <div className="auth-input-wrap">
                                            <select
                                                className="auth-input"
                                                value={form.bloodType}
                                                onChange={(e) => update("bloodType", e.target.value)}
                                            >
                                                <option value="">Unknown</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="auth-eyebrow" style={{ marginTop: '20px', marginBottom: '10px' }}>Emergency Contact</div>
                                <div className="auth-field-group">
                                    <label className="auth-label">Emergency Contact Name</label>
                                    <div className="auth-input-wrap">
                                        <span className="auth-input-icon"><User size={16} /></span>
                                        <input
                                            type="text"
                                            className="auth-input"
                                            placeholder="Full Name"
                                            value={form.emergencyContactName}
                                            onChange={(e) => update("emergencyContactName", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="auth-field-row">
                                    <div className="auth-field-group">
                                        <label className="auth-label">Relationship</label>
                                        <div className="auth-input-wrap">
                                            <input
                                                type="text"
                                                className="auth-input"
                                                placeholder="e.g. Spouse"
                                                value={form.emergencyContactRelationship}
                                                onChange={(e) => update("emergencyContactRelationship", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="auth-field-group">
                                        <label className="auth-label">Phone Number</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon"><Smartphone size={16} /></span>
                                            <input
                                                type="tel"
                                                className="auth-input"
                                                placeholder="Contact Number"
                                                value={form.emergencyContactPhone}
                                                onChange={(e) => update("emergencyContactPhone", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="auth-form">
                                <div style={{ marginBottom: 20 }}>
                                    <PhilippineLocationSelector
                                        onLocationChange={handleLocationChange}
                                    />
                                </div>

                            </div>
                        )}

                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="auth-field-group">
                                    <label className="auth-label">Upload Government-Issued ID *</label>
                                    <input
                                        type="file"
                                        className="auth-input"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFiles({ ...files, governmentId: e.target.files[0] })}
                                    />
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Upload Certificate of Appointment *</label>
                                    <input
                                        type="file"
                                        className="auth-input"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFiles({ ...files, certificateOfAppointment: e.target.files[0] })}
                                    />
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Upload Barangay Resolution (Optional)</label>
                                    <input
                                        type="file"
                                        className="auth-input"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFiles({ ...files, barangayResolution: e.target.files[0] })}
                                    />
                                </div>

                                <div className="auth-field-group">
                                    <label className="auth-label">Upload Selfie with ID *</label>
                                    <input
                                        type="file"
                                        className="auth-input"
                                        accept="image/*"
                                        onChange={(e) => setFiles({ ...files, selfie: e.target.files[0] })}
                                    />
                                </div>

                                <label className="reg-agree-row" style={{ marginTop: '20px' }}>
                                    <input
                                        type="checkbox"
                                        className="reg-checkbox"
                                        checked={form.agree}
                                        onChange={(e) => update("agree", e.target.checked)}
                                    />
                                    <span className="reg-agree-text">
                                        I confirm that I am the duly elected Barangay Captain of the selected barangay.
                                    </span>
                                </label>

                                <div className="reg-btn-row" style={{ marginTop: 24 }}>
                                    <button type="button" onClick={handleBack} className="reg-back-btn">
                                        <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="auth-submit-btn"
                                        style={{ margin: 0 }}
                                        disabled={!form.agree || !form.barangayCode || loading || !files.governmentId || !files.certificateOfAppointment || !files.selfie}
                                    >
                                        {loading ? "Submitting..." : "Submit for Verification"} <ArrowRight size={18} style={{ marginLeft: 8 }} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {step < 4 && (
                            <div className="reg-btn-row">
                                {step > 1 && (
                                    <button type="button" onClick={handleBack} className="reg-back-btn">
                                        <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="auth-submit-btn reg-next-btn"
                                >
                                    Continue <ArrowRight size={18} style={{ marginLeft: 8 }} />
                                </button>
                            </div>
                        )}

                        <div className="auth-card-footer">
                            <span>Already registered your barangay?</span>
                            <button onClick={() => navigate("/login")} className="auth-switch-link">
                                Captain Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

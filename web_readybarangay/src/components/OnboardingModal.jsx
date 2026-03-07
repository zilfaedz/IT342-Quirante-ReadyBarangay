import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    User, Smartphone, Mail, Users, Home, Info,
    Heart, FileText, Check, Camera, ShieldCheck, Siren,
    ArrowRight, ArrowLeft, X
} from "lucide-react";
import "./OnboardingModal.css";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STEPS = [
    { label: 'Basic Info' },
    { label: 'Household' },
    { label: 'Emergency' },
    { label: 'Verify' },
];

const MEDICAL_CONDITIONS = [
    "Hypertension",
    "Diabetes",
    "Heart Disease",
    "Asthma / COPD",
    "Kidney Disease",
    "Mental Health",
    "Mobility Issues",
    "Visual Impairment",
    "Hearing Impairment",
    "Pregnancy",
    "None"
];

export default function OnboardingModal({ isOpen, onClose, user }) {
    const { updateUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.contactNumber || "",
        email: user?.email || "",
        bio: "",
        householdRole: "",
        householdSize: "",
        numberOfChildren: "0",
        address: user?.address || "",
        seniorCitizenPresent: "",
        pwdPresent: "",
        pets: "",
        emergencyContactName: user?.emergencyContactName || "",
        emergencyContactRelationship: user?.emergencyContactRelationship || "",
        emergencyContactPhone: user?.emergencyContactPhone || "",
        bloodType: user?.bloodType || "",
        medicalConditions: [],
        additionalNotes: "",
        profilePicture: null,
        governmentId: null
    });
    const [preview, setPreview] = useState(null);

    const updateField = useCallback((key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            updateField("profilePicture", file);
            setPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
        }
    }, [updateField]);

    const toggleCondition = useCallback((condition) => {
        setForm((prev) => {
            const conditions = [...prev.medicalConditions];
            if (condition === 'None') {
                return { ...prev, medicalConditions: ['None'] };
            }
            const filtered = conditions.filter(c => c !== 'None');
            if (filtered.includes(condition)) {
                return { ...prev, medicalConditions: filtered.filter(c => c !== condition) };
            }
            return { ...prev, medicalConditions: [...filtered, condition] };
        });
    }, []);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const selectedConditions = useMemo(() => {
        return new Set(form.medicalConditions);
    }, [form.medicalConditions]);

    if (!isOpen) return null;

    const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSkip = async () => {
        try {
            // Mark onboarding as completed/skipped so it won't appear again
            await api.post("/auth/skip-onboarding");
            updateUser({ onboardingCompleted: true });
            onClose();
        } catch (err) {
            console.error("Failed to skip onboarding:", err);
            // Still close the modal even if the API call fails
            onClose();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("email", form.email);
            formData.append("bio", form.bio);
            formData.append("householdRole", form.householdRole);
            formData.append("householdSize", form.householdSize);
            formData.append("numberOfChildren", form.numberOfChildren);
            formData.append("seniorCitizenPresent", form.seniorCitizenPresent);
            formData.append("pwdPresent", form.pwdPresent);
            formData.append("pets", form.pets);
            formData.append("medicalConditions", form.medicalConditions.join(", "));
            formData.append("bloodType", form.bloodType);
            formData.append("emergencyContactName", form.emergencyContactName);
            formData.append("emergencyContactRelationship", form.emergencyContactRelationship);
            formData.append("emergencyContactPhone", form.emergencyContactPhone);
            if (form.profilePicture) {
                formData.append("profilePicture", form.profilePicture);
            }

            const response = await api.post("/auth/complete-onboarding", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data.onboardingCompleted) {
                updateUser({ onboardingCompleted: true });
                goNext();
            }
        } catch (err) {
            console.error("Onboarding error:", err);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-wizard">
                <div className="onboarding-bg-orb onboarding-bg-orb-1" />
                <div className="onboarding-bg-orb onboarding-bg-orb-2" />

                <div className="onboarding-header">
                    <div className="onboarding-tag">
                        <div className="onboarding-tag-dot" />
                        Residents Portal
                    </div>
                    <h2 className="onboarding-title">Set Up Your <span className="on-t-red">Profile</span></h2>
                    <p className="onboarding-subtitle">Complete your resident registration for disaster response coordination</p>
                </div>

                <div className="onboarding-progress-wrap">
                    <div className="onboarding-step-indicator">
                        {STEPS.map((s, i) => {
                            const n = i + 1;
                            const state = n === currentStep ? ' active' : n < currentStep ? ' done' : '';
                            return (
                                <React.Fragment key={n}>
                                    <div className="onboarding-step-item">
                                        <div className={`onboarding-step-dot${state}`}>
                                            <span className="onboarding-dot-num">{n < currentStep ? <Check size={14} /> : n}</span>
                                        </div>
                                        <div className="onboarding-step-label">{s.label}</div>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <div className={`onboarding-step-line${n < currentStep ? ' done' : ''}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="onboarding-body">
                    {currentStep === 1 && (
                        <div className="onboarding-step active">
                            <div className="onboarding-step-head">
                                <h3>Basic Information</h3>
                                <p>Start with your personal details and a profile photo.</p>
                            </div>

                            <div className="onboarding-avatar-row">
                                <label className="onboarding-avatar-circle" htmlFor="onboarding-avatar-file">
                                    {!preview ? <User size={32} /> : <img src={preview} alt="Preview" />}
                                </label>
                                <div className="onboarding-avatar-info">
                                    <strong>Profile Photo</strong>
                                    <p>Helps responders identify you in emergencies</p>
                                </div>
                                <label className="onboarding-avatar-btn" htmlFor="onboarding-avatar-file">Upload</label>
                                <input type="file" id="onboarding-avatar-file" hidden onChange={handlePhotoChange} />
                            </div>

                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>First Name</label>
                                    <input type="text" value={form.firstName} readOnly disabled />
                                </div>
                                <div className="onboarding-field">
                                    <label>Last Name</label>
                                    <input type="text" value={form.lastName} readOnly disabled />
                                </div>
                            </div>
                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>Contact Number</label>
                                    <input type="tel" value={form.phone} readOnly disabled />
                                </div>
                                <div className="onboarding-field">
                                    <label>Email</label>
                                    <input type="email" value={form.email} readOnly disabled />
                                </div>
                            </div>
                            <div className="onboarding-field">
                                <label>Bio <span className="opt">optional</span></label>
                                <textarea
                                    placeholder="A brief introduction about yourself…"
                                    value={form.bio}
                                    onChange={(e) => updateField("bio", e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="onboarding-step active">
                            <div className="onboarding-step-head">
                                <h3>Household Information</h3>
                                <p>Helps us allocate resources and coordinate evacuations accurately.</p>
                            </div>

                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>Household Role</label>
                                    <select value={form.householdRole} onChange={(e) => updateField("householdRole", e.target.value)}>
                                        <option value="">Select role…</option>
                                        <option>Head of Household</option>
                                        <option>Household Member</option>
                                    </select>
                                </div>
                                <div className="onboarding-field">
                                    <label>Household Size</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 4"
                                        value={form.householdSize}
                                        onChange={(e) => updateField("householdSize", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>No. of Children</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.numberOfChildren}
                                        onChange={(e) => updateField("numberOfChildren", e.target.value)}
                                    />
                                </div>
                                <div className="onboarding-field">
                                    <label>Pets <span className="opt">evacuation planning</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2 dogs, 1 cat"
                                        value={form.pets}
                                        onChange={(e) => updateField("pets", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="onboarding-divider"><span>Household Composition</span></div>

                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>Senior Citizen Present?</label>
                                    <div className="onboarding-toggle-group">
                                        <button
                                            className={`onboarding-toggle-btn${form.seniorCitizenPresent === 'Yes' ? ' selected' : ''}`}
                                            onClick={() => updateField("seniorCitizenPresent", "Yes")}
                                        >Yes</button>
                                        <button
                                            className={`onboarding-toggle-btn${form.seniorCitizenPresent === 'No' ? ' selected' : ''}`}
                                            onClick={() => updateField("seniorCitizenPresent", "No")}
                                        >No</button>
                                    </div>
                                </div>
                                <div className="onboarding-field">
                                    <label>PWD Present?</label>
                                    <div className="onboarding-toggle-group">
                                        <button
                                            className={`onboarding-toggle-btn${form.pwdPresent === 'Yes' ? ' selected' : ''}`}
                                            onClick={() => updateField("pwdPresent", "Yes")}
                                        >Yes</button>
                                        <button
                                            className={`onboarding-toggle-btn${form.pwdPresent === 'No' ? ' selected' : ''}`}
                                            onClick={() => updateField("pwdPresent", "No")}
                                        >No</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="onboarding-step active">
                            <div className="onboarding-step-head">
                                <h3>Emergency Information</h3>
                                <p>Used only by disaster response personnel in emergencies.</p>
                            </div>

                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>Emergency Contact</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={form.emergencyContactName}
                                        onChange={(e) => updateField("emergencyContactName", e.target.value)}
                                    />
                                </div>
                                <div className="onboarding-field">
                                    <label>Relationship</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Spouse"
                                        value={form.emergencyContactRelationship}
                                        onChange={(e) => updateField("emergencyContactRelationship", e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="onboarding-form-row">
                                <div className="onboarding-field">
                                    <label>Emergency Contact Number</label>
                                    <input
                                        type="tel"
                                        placeholder="Contact Number"
                                        value={form.emergencyContactPhone}
                                        onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
                                    />
                                </div>
                                <div className="onboarding-field">
                                    <label>Blood Type</label>
                                    <select
                                        value={form.bloodType}
                                        onChange={(e) => updateField("bloodType", e.target.value)}
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

                            <div className="onboarding-divider"><span>Medical Conditions</span></div>

                            <div className="onboarding-field">
                                <label>Known Conditions <span className="opt">helps rescuers prioritize</span></label>
                                <div className="onboarding-chip-select">
                                    {MEDICAL_CONDITIONS.map(c => (
                                        <div
                                            key={c}
                                            className={`onboarding-chip${selectedConditions.has(c) ? ' selected' : ''}`}
                                            onClick={() => toggleCondition(c)}
                                        >{c}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-field" style={{ marginTop: 12 }}>
                                <label>Additional Notes <span className="opt">optional</span></label>
                                <textarea
                                    placeholder="Medications, allergies, or special needs…"
                                    value={form.additionalNotes}
                                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="onboarding-step active">
                            <div className="onboarding-step-head">
                                <h3>Verification Status</h3>
                                <p>Review your submitted documents and notice below.</p>
                            </div>

                            <div className="onboarding-upload-zone completed">
                                <div className="onboarding-upload-icon"><ShieldCheck size={32} color="var(--accent-amber)" /></div>
                                <h4>Identity Verified</h4>
                                <p>Your government ID was collected during registration.</p>
                            </div>

                            <div className="onboarding-alert-notice">
                                <p>
                                    <strong>⚠️ Review Notice</strong>
                                    Your profile details will be updated. Your residency status is currently pending approval by your Barangay Captain.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="onboarding-success">
                            <div className="onboarding-success-icon"><Check size={32} /></div>
                            <h3>Profile <span className="on-t-green">Submitted</span></h3>
                            <p>Your resident profile is now complete. Stay alert for official announcements through this portal.</p>
                            <div className="onboarding-success-tags">
                                <span className="on-stag g">✓ Basic Info</span>
                                <span className="on-stag g">✓ Household</span>
                                <span className="on-stag g">✓ Emergency Info</span>
                                <span className="on-stag a">⏳ Verification Pending</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="onboarding-footer">
                    {currentStep < 5 ? (
                        <>
                            <button className="onboarding-skip-btn" onClick={handleSkip}>Skip for now</button>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {currentStep > 1 && (
                                    <button className="onboarding-btn onboarding-btn-back" onClick={goBack}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}
                                <button
                                    className="onboarding-btn onboarding-btn-next"
                                    onClick={currentStep === 4 ? handleSubmit : goNext}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : currentStep === 4 ? "Complete →" : "Continue →"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <button className="onboarding-btn onboarding-btn-success" style={{ width: '100%' }} onClick={onClose}>
                            Go to Dashboard →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

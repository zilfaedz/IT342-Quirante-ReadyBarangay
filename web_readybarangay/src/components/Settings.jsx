import React, { useState, useEffect } from "react";
import {
    Shield, Camera, CheckCircle2, Edit2, Trash2, Lock, ShieldCheck, Save, Info, Users, Heart
} from "lucide-react";
import { updateProfile, updatePurok } from "../services/api";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Settings({ user }) {
    const { updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState("personal");
    const [userData, setUserData] = useState(user);
    const [visibility, setVisibility] = useState(user?.profileVisibility || "OFFICIALS");
    const [purok, setPurok] = useState(user?.purok || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Household Information
    const [householdRole, setHouseholdRole] = useState(user?.householdRole || "");
    const [householdSize, setHouseholdSize] = useState(user?.householdSize || "");
    const [numberOfChildren, setNumberOfChildren] = useState(user?.numberOfChildren || "0");
    const [seniorCitizenPresent, setSeniorCitizenPresent] = useState(user?.seniorCitizenPresent || "");
    const [pwdPresent, setPwdPresent] = useState(user?.pwdPresent || "");
    const [pets, setPets] = useState(user?.pets || "");

    // Emergency Information
    const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || "");
    const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(user?.emergencyContactRelationship || "");
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || "");
    const [bloodType, setBloodType] = useState(user?.bloodType || "");
    const [medicalConditions, setMedicalConditions] = useState(user?.medicalConditions ? user.medicalConditions.split(", ") : []);
    const [additionalNotes, setAdditionalNotes] = useState(user?.additionalNotes || "");

    // Fetch latest user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data) {
                    setUserData(response.data);
                    // Update all state with fresh data
                    setVisibility(response.data?.profileVisibility || "OFFICIALS");
                    setPurok(response.data?.purok || "");
                    setBio(response.data?.bio || "");
                    setHouseholdRole(response.data?.householdRole || "");
                    setHouseholdSize(response.data?.householdSize || "");
                    setNumberOfChildren(response.data?.numberOfChildren || "0");
                    setSeniorCitizenPresent(response.data?.seniorCitizenPresent || "");
                    setPwdPresent(response.data?.pwdPresent || "");
                    setPets(response.data?.pets || "");
                    setEmergencyContactName(response.data?.emergencyContactName || "");
                    setEmergencyContactRelationship(response.data?.emergencyContactRelationship || "");
                    setEmergencyContactPhone(response.data?.emergencyContactPhone || "");
                    setBloodType(response.data?.bloodType || "");
                    setMedicalConditions(response.data?.medicalConditions ? response.data.medicalConditions.split(", ").filter(c => c) : []);
                    setAdditionalNotes(response.data?.additionalNotes || "");
                }
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchUserData();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const [profileResp] = await Promise.all([
                updateProfile({ 
                    ...userData, 
                    purok, 
                    profileVisibility: visibility,
                    bio,
                    householdRole,
                    householdSize,
                    numberOfChildren,
                    seniorCitizenPresent,
                    pwdPresent,
                    pets,
                    emergencyContactName,
                    emergencyContactRelationship,
                    emergencyContactPhone,
                    bloodType,
                    medicalConditions: medicalConditions.join(", "),
                    additionalNotes
                }),
                updatePurok(purok)
            ]);
            alert("Settings updated successfully!");
            // sync context with any returned user data
            if (profileResp && profileResp.data && profileResp.data.user) {
                updateUser(profileResp.data.user);
                setUserData(profileResp.data.user);
            }
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    const toggleCondition = (condition) => {
        setMedicalConditions(prev => {
            if (condition === 'None') {
                return ['None'];
            }
            const filtered = prev.filter(c => c !== 'None');
            if (filtered.includes(condition)) {
                return filtered.filter(c => c !== condition);
            }
            return [...filtered, condition];
        });
    };

    const tabs = [
        { id: "personal", label: "Personal Information", icon: <Info size={16} /> },
        { id: "household", label: "Household Information", icon: <Users size={16} /> },
        { id: "health", label: "Health & Medical", icon: <Heart size={16} /> },
        { id: "emergency", label: "Emergency Info", icon: <Shield size={16} /> },
        { id: "security", label: "Account Security", icon: <Lock size={16} /> },
    ];

    if (loadingData) {
        return <div className="rb-section-title" style={{ marginBottom: 20 }}>Loading user information…</div>;
    }

    return (
        <div>
            <div className="rb-section-title" style={{ marginBottom: 20 }}>Settings</div>
            
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--gray-200)", paddingBottom: 12, overflowX: "auto" }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 16px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            color: activeTab === tab.id ? "var(--blue-600)" : "var(--gray-600)",
                            borderBottom: activeTab === tab.id ? "2px solid var(--blue-600)" : "none",
                            marginBottom: "-12px",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "personal" && (
                <div className="rb-card">
                    <div className="rb-card-header"><div className="rb-card-title">Personal Information</div></div>
                    <div className="rb-card-body">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar">
                                {(userData?.firstName || userData?.email)?.charAt(0) || "U"}
                            </div>
                            <div className="profile-info-group">
                                <div className="profile-name">
                                    {userData?.firstName} {userData?.lastName}
                                </div>
                                <div className="profile-role">Resident · Barangay {userData?.barangay || "76"}</div>
                                <button className="rb-btn rb-btn-secondary rb-btn-sm" style={{ marginTop: 8 }}>
                                    <Camera size={13} style={{ marginRight: 6 }} /> Change Photo
                                </button>
                            </div>
                        </div>
                        <div className="rb-grid-2" style={{ gap: 12 }}>
                            <div className="rb-form-group">
                                <label className="rb-label">First Name</label>
                                <input className="rb-input" value={userData?.firstName || ""} readOnly />
                            </div>
                            <div className="rb-form-group">
                                <label className="rb-label">Last Name</label>
                                <input className="rb-input" value={userData?.lastName || ""} readOnly />
                            </div>
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Bio</label>
                            <textarea
                                className="rb-input"
                                placeholder="A brief introduction about yourself…"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Purok / Area</label>
                            <input
                                className="rb-input"
                                placeholder="Enter your purok (e.g. Purok 1, Sitio Maligaya)"
                                value={purok}
                                onChange={(e) => setPurok(e.target.value)}
                            />
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Address</label>
                            <input className="rb-input" value={userData?.address || "Address not set"} readOnly />
                        </div>

                        <div style={{ margin: "20px 0", padding: "16px", background: "var(--gray-50)", borderRadius: "12px", border: "1px solid var(--gray-200)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Shield size={16} style={{ color: "var(--blue-600)" }} />
                                <strong style={{ fontSize: 13, color: "var(--gray-900)" }}>Profile Visibility</strong>
                            </div>

                            <select
                                className="rb-input"
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                style={{ marginBottom: 10 }}
                            >
                                <option value="PRIVATE">Private (Only me)</option>
                                <option value="OFFICIALS">Officials Only (Searchable by Barangay Officials)</option>
                                <option value="RESIDENTS">All Residents (Searchable by Neighbors)</option>
                            </select>

                            <p style={{ fontSize: 11.5, color: "var(--gray-500)", lineHeight: 1.4 }}>
                                Controls who can see your profile in the Community Directory.
                                <strong>Private</strong> means you won't appear in the directory at all.
                            </p>
                        </div>

                        <button
                            className="rb-btn rb-btn-primary"
                            style={{ width: "100%" }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : <><Save size={15} style={{ marginRight: 8 }} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "household" && (
                <div className="rb-card">
                    <div className="rb-card-header"><div className="rb-card-title">Household Information</div></div>
                    <div className="rb-card-body">
                        <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 20 }}>
                            Helps us allocate resources and coordinate evacuations accurately.
                        </p>

                        <div className="rb-grid-2" style={{ gap: 12, marginBottom: 20 }}>
                            <div className="rb-form-group">
                                <label className="rb-label">Household Role</label>
                                <select 
                                    className="rb-input" 
                                    value={householdRole} 
                                    onChange={(e) => setHouseholdRole(e.target.value)}
                                >
                                    <option value="">Select role…</option>
                                    <option value="Head of Household">Head of Household</option>
                                    <option value="Household Member">Household Member</option>
                                </select>
                            </div>
                            <div className="rb-form-group">
                                <label className="rb-label">Household Size</label>
                                <input
                                    type="number"
                                    className="rb-input"
                                    min="1"
                                    placeholder="e.g. 4"
                                    value={householdSize}
                                    onChange={(e) => setHouseholdSize(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rb-grid-2" style={{ gap: 12, marginBottom: 20 }}>
                            <div className="rb-form-group">
                                <label className="rb-label">Number of Children</label>
                                <input
                                    type="number"
                                    className="rb-input"
                                    min="0"
                                    value={numberOfChildren}
                                    onChange={(e) => setNumberOfChildren(e.target.value)}
                                />
                            </div>
                            <div className="rb-form-group">
                                <label className="rb-label">Pets <span style={{ fontSize: 11, color: "var(--gray-500)" }}>(evacuation planning)</span></label>
                                <input
                                    type="text"
                                    className="rb-input"
                                    placeholder="e.g. 2 dogs, 1 cat"
                                    value={pets}
                                    onChange={(e) => setPets(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--gray-200)" }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)", marginBottom: 16 }}>Household Composition</h4>
                            
                            <div className="rb-grid-2" style={{ gap: 12 }}>
                                <div className="rb-form-group">
                                    <label className="rb-label">Senior Citizen Present?</label>
                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                        <button
                                            className="rb-btn"
                                            style={{
                                                flex: 1,
                                                background: seniorCitizenPresent === 'Yes' ? 'var(--blue-600)' : 'var(--gray-100)',
                                                color: seniorCitizenPresent === 'Yes' ? 'white' : 'var(--gray-600)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSeniorCitizenPresent('Yes')}
                                        >Yes</button>
                                        <button
                                            className="rb-btn"
                                            style={{
                                                flex: 1,
                                                background: seniorCitizenPresent === 'No' ? 'var(--blue-600)' : 'var(--gray-100)',
                                                color: seniorCitizenPresent === 'No' ? 'white' : 'var(--gray-600)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSeniorCitizenPresent('No')}
                                        >No</button>
                                    </div>
                                </div>
                                <div className="rb-form-group">
                                    <label className="rb-label">PWD Present?</label>
                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                        <button
                                            className="rb-btn"
                                            style={{
                                                flex: 1,
                                                background: pwdPresent === 'Yes' ? 'var(--blue-600)' : 'var(--gray-100)',
                                                color: pwdPresent === 'Yes' ? 'white' : 'var(--gray-600)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setPwdPresent('Yes')}
                                        >Yes</button>
                                        <button
                                            className="rb-btn"
                                            style={{
                                                flex: 1,
                                                background: pwdPresent === 'No' ? 'var(--blue-600)' : 'var(--gray-100)',
                                                color: pwdPresent === 'No' ? 'white' : 'var(--gray-600)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setPwdPresent('No')}
                                        >No</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            className="rb-btn rb-btn-primary"
                            style={{ width: "100%" }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : <><Save size={15} style={{ marginRight: 8 }} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "health" && (
                <div className="rb-card">
                    <div className="rb-card-header"><div className="rb-card-title">Health & Medical Information</div></div>
                    <div className="rb-card-body">
                        <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 20 }}>
                            Used only by disaster response personnel in emergencies to provide better care.
                        </p>

                        <div className="rb-grid-2" style={{ gap: 12, marginBottom: 20 }}>
                            <div className="rb-form-group">
                                <label className="rb-label">Blood Type</label>
                                <select
                                    className="rb-input"
                                    value={bloodType}
                                    onChange={(e) => setBloodType(e.target.value)}
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

                        <div style={{ marginBottom: 20 }}>
                            <label className="rb-label" style={{ marginBottom: 12, display: "block" }}>
                                Known Medical Conditions <span style={{ fontSize: 11, color: "var(--gray-500)" }}>(helps rescuers prioritize)</span>
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {[
                                    "Hypertension", "Diabetes", "Heart Disease",
                                    "Asthma / COPD", "Kidney Disease", "Mental Health",
                                    "Mobility Issues", "Visual Impairment",
                                    "Hearing Impairment", "Pregnancy", "None"
                                ].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => toggleCondition(c)}
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--gray-300)",
                                            background: medicalConditions.includes(c) ? "var(--blue-600)" : "var(--gray-50)",
                                            color: medicalConditions.includes(c) ? "white" : "var(--gray-700)",
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontWeight: 500,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rb-form-group">
                            <label className="rb-label">Additional Notes <span style={{ fontSize: 11, color: "var(--gray-500)" }}>(optional)</span></label>
                            <textarea
                                className="rb-input"
                                placeholder="Medications, allergies, or special needs…"
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <button
                            className="rb-btn rb-btn-primary"
                            style={{ width: "100%" }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : <><Save size={15} style={{ marginRight: 8 }} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "emergency" && (
                <div className="rb-card">
                    <div className="rb-card-header"><div className="rb-card-title">Emergency Information</div></div>
                    <div className="rb-card-body">
                        <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 20 }}>
                            Used only by disaster response personnel in emergencies.
                        </p>

                        <div className="rb-grid-2" style={{ gap: 12, marginBottom: 20 }}>
                            <div className="rb-form-group">
                                <label className="rb-label">Emergency Contact Name</label>
                                <input
                                    type="text"
                                    className="rb-input"
                                    placeholder="Full Name"
                                    value={emergencyContactName}
                                    onChange={(e) => setEmergencyContactName(e.target.value)}
                                />
                            </div>
                            <div className="rb-form-group">
                                <label className="rb-label">Relationship</label>
                                <input
                                    type="text"
                                    className="rb-input"
                                    placeholder="e.g. Spouse"
                                    value={emergencyContactRelationship}
                                    onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rb-form-group">
                            <label className="rb-label">Emergency Contact Number</label>
                            <input
                                type="tel"
                                className="rb-input"
                                placeholder="Contact Number"
                                value={emergencyContactPhone}
                                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                            />
                        </div>

                        <button
                            className="rb-btn rb-btn-primary"
                            style={{ width: "100%", marginTop: 20 }}
                            onClick={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : <><Save size={15} style={{ marginRight: 8 }} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "security" && (
                <div className="rb-card">
                    <div className="rb-card-header"><div className="rb-card-title">Account Security</div></div>
                    <div className="rb-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <button className="rb-btn rb-btn-secondary" style={{ width: "100%" }}>
                            <Lock size={15} style={{ marginRight: 8 }} /> Change Password
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--green-50)", borderRadius: 8, fontSize: 12, color: "var(--green-700)", fontFamily: "var(--font-ui)", border: "1px solid var(--green-200)" }}>
                            <ShieldCheck size={14} />
                            <span>Account verified & secured</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

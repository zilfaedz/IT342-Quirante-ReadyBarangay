import { useState, useEffect } from "react";
import { Plus, MapPin, Trash2, Save, X, Activity } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { getEvacuationCenters, createEvacuationCenter, updateEvacuationCenter, deleteEvacuationCenter } from "../services/api";

const AddMarker = ({ onClick }) => {
    useMapEvents({
        click(e) { onClick(e.latlng); },
    });
    return null;
};

const ManageEvacuationCenters = () => {
    const [centers, setCenters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        latitude: null,
        longitude: null,
        capacity: "",
        currentOccupancy: "0",
        status: "Open"
    });

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        setIsLoading(true);
        try {
            const data = await getEvacuationCenters();
            setCenters(data);
        } catch (error) {
            console.error("Failed to fetch centers", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMapClick = (latlng) => {
        if (!showForm) setShowForm(true);
        setForm(prev => ({ ...prev, latitude: latlng.lat, longitude: latlng.lng }));
    };

    const handleSave = async () => {
        if (!form.name || !form.latitude || !form.longitude || !form.capacity) return alert("Please fill all required fields and pick a location.");
        setIsSaving(true);
        try {
            if (editingId) {
                await updateEvacuationCenter(editingId, {
                    capacity: form.capacity,
                    currentOccupancy: form.currentOccupancy,
                    status: form.status
                });
            } else {
                const fd = new FormData();
                Object.keys(form).forEach(k => fd.append(k, form[k]));
                await createEvacuationCenter(fd);
            }
            setShowForm(false);
            setEditingId(null);
            setForm({ name: "", latitude: null, longitude: null, capacity: "", currentOccupancy: "0", status: "Open" });
            fetchCenters();
        } catch (error) {
            console.error("Error saving center", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this evacuation center?")) {
            try {
                await deleteEvacuationCenter(id);
                fetchCenters();
            } catch (error) {
                console.error("Error deleting center", error);
            }
        }
    };

    const handleEdit = (center) => {
        setForm({
            name: center.name,
            latitude: center.latitude,
            longitude: center.longitude,
            capacity: center.capacity,
            currentOccupancy: center.currentOccupancy,
            status: center.status
        });
        setEditingId(center.id);
        setShowForm(true);
    };

    return (
        <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
            <div className="rb-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 className="rb-card-title">Evacuation Map</h3>
                    <div style={{ fontSize: 13, color: "var(--gray-500)" }}>Click anywhere on the map to add a new center.</div>
                </div>

                <div style={{ height: 400, borderRadius: 12, overflow: 'hidden', border: "1px solid var(--gray-200)", position: "relative" }}>
                    <MapContainer center={[10.3157, 123.8854]} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <AddMarker onClick={handleMapClick} />

                        {centers.map(c => (
                            <Marker key={c.id} position={[c.latitude, c.longitude]} />
                        ))}

                        {form.latitude && form.longitude && !editingId && (
                            <Marker position={[form.latitude, form.longitude]} />
                        )}
                    </MapContainer>
                </div>
            </div>

            {showForm && (
                <div className="rb-card" style={{ padding: 20, animation: "modal-in 0.2s" }}>
                    <h3 className="rb-card-title" style={{ marginBottom: 16 }}>{editingId ? "Update Center" : "New Evacuation Center"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="rb-form-group">
                            <label className="rb-label">Center Name</label>
                            <input className="rb-input" disabled={editingId} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Barangay Hall Gym" />
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Total Capacity</label>
                            <input type="number" className="rb-input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Max people allowed" />
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Current Occupancy</label>
                            <input type="number" className="rb-input" value={form.currentOccupancy} onChange={e => setForm({ ...form, currentOccupancy: e.target.value })} />
                        </div>
                        <div className="rb-form-group">
                            <label className="rb-label">Status</label>
                            <select className="rb-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="Open">Open</option>
                                <option value="Full">Full</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button className="rb-btn rb-btn-primary" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Saving..." : <><Save size={16} /> Save Center</>}
                        </button>
                        <button className="rb-btn rb-btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); setForm({ name: "", latitude: null, longitude: null, capacity: "", currentOccupancy: "0", status: "Open" }); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="rb-card">
                <div className="rb-card-header">
                    <div className="rb-card-title">Managed Centers</div>
                </div>
                <div className="rb-table-wrap">
                    <table className="rb-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Occupancy</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? <tr><td colSpan="4" style={{ textAlign: "center", padding: 20 }}>Loading...</td></tr> : centers.length === 0 ? <tr><td colSpan="4" style={{ textAlign: "center", padding: 20 }}>No centers added yet. Click map to add.</td></tr> : centers.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                                    <td>{c.currentOccupancy} / {c.capacity}</td>
                                    <td>
                                        <span className={`rb-badge ${c.status.toLowerCase()}`}>{c.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="rb-btn rb-btn-secondary rb-btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                                            <button className="rb-btn rb-btn-ghost rb-btn-sm" style={{ color: "var(--red-600)" }} onClick={() => handleDelete(c.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageEvacuationCenters;

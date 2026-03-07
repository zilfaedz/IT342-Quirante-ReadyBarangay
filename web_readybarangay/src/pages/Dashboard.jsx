import { useAuth } from "../context/AuthContext";
import DashboardResident from "./DashboardResident";
import DashboardOfficial from "./DashboardOfficial";
import DashboardResponder from "./DashboardResponder";
import DashboardCaptain from "./DashboardCaptain";

export default function Dashboard() {
    const { user } = useAuth();

    // Route based on role
    const role = user?.role?.toLowerCase() || "resident";

    if (role === "captain" || role === "barangay captain") {
        return <DashboardCaptain user={user} />;
    }

    if (role === "official") {
        return <DashboardOfficial user={user} />;
    }

    if (role === "responder") {
        return <DashboardResponder user={user} />;
    }

    // Default to Resident
    return <DashboardResident user={user} />;
}
package com.android.mobile

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.navigation.NavigationView
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

data class MobileCard(val title: String, val value: String, val hint: String)
data class MobileSection(val title: String, val subtitle: String)

class DashboardPage : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {
    private lateinit var drawerLayout: DrawerLayout
    private lateinit var navView: NavigationView
    private lateinit var titleText: TextView
    private lateinit var subtitleText: TextView
    private lateinit var bellCount: TextView
    private lateinit var cardsRecycler: RecyclerView
    private lateinit var cardsAdapter: MobileCardAdapter

    private var token: String = ""
    private var currentItemId: Int = R.id.nav_dashboard

    private val sections = mapOf(
        R.id.nav_dashboard to MobileSection("Resident Dashboard", "System overview, recent activity, and quick statistics"),
        R.id.nav_emergency_reports to MobileSection("Emergency Reports", "Track incidents and report emergencies quickly"),
        R.id.nav_evacuation_centers to MobileSection("Evacuation Centers", "Check nearby centers and capacity updates"),
        R.id.nav_announcements to MobileSection("Announcements", "Barangay notices, alerts, and advisories"),
        R.id.nav_directory to MobileSection("Community Directory", "Find barangay officials and verified neighbors"),
        R.id.nav_hotlines to MobileSection("Emergency Hotlines", "Quick access to emergency contact numbers"),
        R.id.nav_settings to MobileSection("Settings", "Manage profile and application preferences")
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard_page)

        token = SessionManager.getToken(this).orEmpty()
        if (token.isBlank()) {
            startActivity(Intent(this, LoginPage::class.java))
            finish()
            return
        }
        BackendApi.setBaseUrl(SessionManager.getBackendUrl(this))

        drawerLayout = findViewById(R.id.drawer_layout)
        navView = findViewById(R.id.nav_view)
        titleText = findViewById(R.id.tv_header_title)
        subtitleText = findViewById(R.id.tv_header_subtitle)
        bellCount = findViewById(R.id.tv_bell_count)
        cardsRecycler = findViewById(R.id.recycler_cards)
        val menuBtn = findViewById<ImageButton>(R.id.btn_menu)

        cardsAdapter = MobileCardAdapter(emptyList())
        cardsRecycler.layoutManager = LinearLayoutManager(this)
        cardsRecycler.setHasFixedSize(true)
        cardsRecycler.itemAnimator = null
        cardsRecycler.adapter = cardsAdapter

        menuBtn.setOnClickListener { drawerLayout.openDrawer(GravityCompat.START) }
        navView.setNavigationItemSelectedListener(this)

        navView.setCheckedItem(R.id.nav_dashboard)
        applySection(R.id.nav_dashboard)
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        drawerLayout.closeDrawer(GravityCompat.START)

        if (item.itemId == R.id.nav_logout) {
            SessionManager.clear(this)
            Toast.makeText(this, "Logged out", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, LoginPage::class.java))
            finish()
            return true
        }

        applySection(item.itemId)
        return true
    }

    private fun applySection(itemId: Int) {
        currentItemId = itemId
        val section = sections[itemId] ?: return
        titleText.text = section.title
        subtitleText.text = section.subtitle

        cardsAdapter.submit(
            listOf(
                MobileCard("Loading", "...", "Fetching live data"),
                MobileCard("Please wait", "...", "Preparing section content")
            )
        )

        Thread {
            val cards = try {
                fetchSectionCards(itemId)
            } catch (e: Exception) {
                listOf(
                    MobileCard("Connection issue", "N/A", "Could not load backend data"),
                    MobileCard("Error", e.message ?: "Unknown error", "Check API server and login token")
                )
            }

            runOnUiThread {
                if (currentItemId == itemId) {
                    cardsAdapter.submit(cards)
                    bellCount.text = deriveNotificationCount(cards)
                }
            }
        }.start()
    }

    private fun fetchSectionCards(itemId: Int): List<MobileCard> {
        return when (itemId) {
            R.id.nav_dashboard -> fetchDashboardCards()
            R.id.nav_emergency_reports -> fetchEmergencyReportCards()
            R.id.nav_evacuation_centers -> fetchEvacuationCards()
            R.id.nav_announcements -> fetchAnnouncementCards()
            R.id.nav_directory -> fetchDirectoryCards()
            R.id.nav_hotlines -> fetchHotlineCards()
            R.id.nav_settings -> fetchSettingsCards()
            else -> listOf(MobileCard("Section", "N/A", "Unavailable"))
        }
    }

    private fun fetchDashboardCards(): List<MobileCard> {
        val reports = BackendApi.asArray(BackendApi.get("/reports", token)) ?: JSONArray()
        val dashboard = BackendApi.asObject(BackendApi.get("/dashboard/data", token)) ?: JSONObject()
        val me = BackendApi.asObject(BackendApi.get("/user/me", token)) ?: JSONObject()
        val alerts = dashboard.optJSONArray("weatherAlerts") ?: JSONArray()
        val openReports = countNotStatus(reports, "RESOLVED")

        return listOf(
            MobileCard("Welcome", me.optString("fullName", "Resident"), "Signed-in account"),
            MobileCard("Active Reports", openReports.toString(), "Unresolved incidents"),
            MobileCard("Weather Alerts", alerts.length().toString(), "Current advisories"),
            MobileCard("Nearest Center", extractFirstCenterName(dashboard), "Suggested evacuation site")
        )
    }

    private fun fetchEmergencyReportCards(): List<MobileCard> {
        val reports = BackendApi.asArray(BackendApi.get("/reports", token)) ?: JSONArray()
        var open = 0
        var resolved = 0
        var highUrgency = 0
        for (i in 0 until reports.length()) {
            val r = reports.optJSONObject(i) ?: continue
            val status = r.optString("status", "").uppercase(Locale.US)
            if (status == "RESOLVED") resolved++ else open++
            val urgency = r.optString("urgency", "").uppercase(Locale.US)
            if (urgency == "HIGH" || urgency == "CRITICAL") highUrgency++
        }
        return listOf(
            MobileCard("Open Reports", open.toString(), "Needs follow-up"),
            MobileCard("Resolved Reports", resolved.toString(), "Closed incidents"),
            MobileCard("High Urgency", highUrgency.toString(), "High or critical cases"),
            MobileCard("Total Reports", reports.length().toString(), "All report records")
        )
    }

    private fun fetchEvacuationCards(): List<MobileCard> {
        val centers = BackendApi.asArray(BackendApi.get("/evacuation-centers/scoped?scope=province", token))
            ?: BackendApi.asArray(BackendApi.get("/evacuation-centers", token))
            ?: JSONArray()
        var open = 0
        var full = 0
        var occupied = 0
        var capacity = 0
        for (i in 0 until centers.length()) {
            val c = centers.optJSONObject(i) ?: continue
            when (c.optString("status", "").uppercase(Locale.US)) {
                "OPEN" -> open++
                "FULL" -> full++
            }
            occupied += c.optInt("currentOccupancy", 0)
            capacity += c.optInt("capacity", 0)
        }
        val capText = if (capacity > 0) "${occupied * 100 / capacity}%" else "0%"
        return listOf(
            MobileCard("Available Centers", open.toString(), "Open for evacuation"),
            MobileCard("Full Centers", full.toString(), "At maximum capacity"),
            MobileCard("Total Centers", centers.length().toString(), "Visible in your scope"),
            MobileCard("Overall Occupancy", capText, "$occupied of $capacity occupied")
        )
    }

    private fun fetchAnnouncementCards(): List<MobileCard> {
        val dashboard = BackendApi.asObject(BackendApi.get("/dashboard/data", token)) ?: JSONObject()
        val weatherAlerts = dashboard.optJSONArray("weatherAlerts") ?: JSONArray()
        val earthquake = dashboard.optString("earthquakeAlert", "")
        return listOf(
            MobileCard("Active Advisories", weatherAlerts.length().toString(), "Weather and hazard alerts"),
            MobileCard("Earthquake Feed", if (earthquake.isBlank()) "Normal" else "Updated", "Latest seismic notice"),
            MobileCard("Broadcast Scope", "Barangay", "Resident-facing announcements"),
            MobileCard("Maintenance Notice", "None", "No active maintenance")
        )
    }

    private fun fetchDirectoryCards(): List<MobileCard> {
        val directory = BackendApi.asArray(BackendApi.get("/directory", token)) ?: JSONArray()
        var captains = 0
        var officials = 0
        var residents = 0
        for (i in 0 until directory.length()) {
            val role = directory.optJSONObject(i)?.optString("role", "")?.uppercase(Locale.US) ?: ""
            when {
                role == "BARANGAY CAPTAIN" -> captains++
                role == "OFFICIAL" || role == "TANOD" -> officials++
                else -> residents++
            }
        }
        return listOf(
            MobileCard("Directory Entries", directory.length().toString(), "Visible members"),
            MobileCard("Captains", captains.toString(), "Barangay captain records"),
            MobileCard("Officials", officials.toString(), "Officials and tanod"),
            MobileCard("Residents", residents.toString(), "General resident entries")
        )
    }

    private fun fetchHotlineCards(): List<MobileCard> {
        return listOf(
            MobileCard("National Emergency", "911", "Primary emergency hotline"),
            MobileCard("Fire Service", "160", "Bureau of Fire Protection"),
            MobileCard("Police", "117", "National police emergency"),
            MobileCard("Red Cross", "143", "Medical assistance hotline")
        )
    }

    private fun fetchSettingsCards(): List<MobileCard> {
        val me = BackendApi.asObject(BackendApi.get("/user/me", token)) ?: JSONObject()
        return listOf(
            MobileCard("Profile Name", me.optString("fullName", "Resident"), "Current account"),
            MobileCard("Role", me.optString("role", "RESIDENT"), "Portal access type"),
            MobileCard("Barangay", me.optString("barangay", "N/A"), "Registered barangay"),
            MobileCard("Account Status", me.optString("accountStatus", "APPROVED"), "Current state")
        )
    }

    private fun countNotStatus(reports: JSONArray, status: String): Int {
        var count = 0
        for (i in 0 until reports.length()) {
            val s = reports.optJSONObject(i)?.optString("status", "") ?: ""
            if (!s.equals(status, true)) count++
        }
        return count
    }

    private fun extractFirstCenterName(dashboard: JSONObject): String {
        val centers = dashboard.optJSONArray("evacuationCenters") ?: return "N/A"
        if (centers.length() == 0) return "N/A"
        return centers.optJSONObject(0)?.optString("name", "N/A") ?: "N/A"
    }

    private fun deriveNotificationCount(cards: List<MobileCard>): String {
        val firstNumeric = cards
            .map { it.value.filter { ch -> ch.isDigit() } }
            .firstOrNull { it.isNotBlank() }
            ?.take(2)
        return firstNumeric ?: "1"
    }
}

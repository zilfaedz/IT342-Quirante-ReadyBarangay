package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class DashboardController {

        @Autowired
        private UserRepository userRepository;

        @GetMapping("/data")
        public ResponseEntity<?> getDashboardData() {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                User currentUser = null;
                if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
                        currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
                }

                String captainName = "Pending Verification";
                String captainContact = "N/A";

                if (currentUser != null && currentUser.getBarangayCode() != null) {
                        User captain = userRepository.findFirstByBarangayCodeAndRoleAndAccountStatusOrderByIdDesc(
                                        currentUser.getBarangayCode(), "Barangay Captain", "APPROVED").orElse(null);
                        if (captain != null) {
                                captainName = captain.getFullName();
                                if (captainName == null || captainName.trim().isEmpty()) {
                                        captainName = captain.getFirstName() + " " + captain.getLastName();
                                }
                                captainContact = captain.getContactNumber() != null ? captain.getContactNumber()
                                                : "N/A";
                        }
                }

                return ResponseEntity.ok(Map.of(
                                "captainName", captainName,
                                "captainContact", captainContact,
                                "weatherAlerts", List.of(
                                                Map.of("type", "Typhoon Warning", "message",
                                                                "Typhoon Bising is approaching. Please stay indoors.",
                                                                "severity", "high"),
                                                Map.of("type", "Heavy Rainfall", "message",
                                                                "Expect heavy rainfall in the next 24 hours.",
                                                                "severity", "medium")),
                                "evacuationCenters", List.of(
                                                Map.of("name", "Barangay Hall Evacuation Center", "capacity", "500",
                                                                "status", "Open"),
                                                Map.of("name", "Local Elementary School", "capacity", "1000", "status",
                                                                "Full")),
                                "hotlines", List.of(
                                                Map.of("name", "National Emergency Hotline", "number", "911"),
                                                Map.of("name", "NDRRMC", "number", "0917-899-2222"),
                                                Map.of("name", "Red Cross", "number", "143"))));
        }
}

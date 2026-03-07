package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.EmergencyReport;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.EmergencyReportRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class ReportController {

    @Autowired
    private EmergencyReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping
    public ResponseEntity<?> submitReport(
            @RequestParam("description") String description,
            @RequestParam("location") String location,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam("incidentType") String incidentType,
            @RequestParam(value = "urgency", defaultValue = "Medium") String urgency,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        EmergencyReport report = new EmergencyReport();
        report.setUser(currentUser);
        report.setDescription(description);
        report.setLocation(location);
        report.setLatitude(latitude);
        report.setLongitude(longitude);
        report.setIncidentType(incidentType);
        report.setUrgency(urgency);

        if (photo != null && !photo.isEmpty()) {
            try {
                // Ensure upload directory exists
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                // Generate a unique filename
                String originalFileName = StringUtils.cleanPath(photo.getOriginalFilename());
                String fileExtension = "";
                if (originalFileName.contains(".")) {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String newFileName = UUID.randomUUID().toString() + fileExtension;

                Path filePath = uploadPath.resolve(newFileName);
                Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                report.setPhotoUrl("/uploads/" + newFileName);

            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Failed to upload photo: " + e.getMessage()));
            }
        }

        try {
            reportRepository.save(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Database save failed: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Emergency report submitted successfully",
                "report", report));
    }

    @GetMapping
    public ResponseEntity<?> getReports() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        List<EmergencyReport> reports;

        // If OFFICIAL/CAPTAIN/RESPONDER, return all reports in their barangay; if
        // RESIDENT, return only theirs
        String role = currentUser.getRole();
        if ("OFFICIAL".equals(role) || "Barangay Captain".equals(role) || "RESPONDER".equals(role)
                || "Super Admin".equals(role)) {
            String userBarangayCode = currentUser.getBarangayCode();
            if (!"Super Admin".equals(role) && userBarangayCode != null && !userBarangayCode.isEmpty()) {
                reports = reportRepository.findByUserBarangayCodeOrderByCreatedAtDesc(userBarangayCode);
            } else {
                reports = reportRepository.findAllByOrderByCreatedAtDesc(); // Fallback if no barangay code
            }
        } else {
            reports = reportRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        }

        return ResponseEntity.ok(reports);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignResponder(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        String role = currentUser.getRole();
        if (!"Barangay Captain".equalsIgnoreCase(role) && !"OFFICIAL".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Captains and Officials can assign responders."));
        }

        EmergencyReport report = reportRepository.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Report not found."));
        }

        Long responderId = payload.get("responderId");
        if (responderId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Responder ID is required."));
        }

        User responder = userRepository.findById(responderId).orElse(null);
        if (responder == null || !"RESPONDER".equalsIgnoreCase(responder.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Target user must be a valid Responder."));
        }

        report.setResponder(responder);
        reportRepository.save(report);

        return ResponseEntity.ok(Map.of("message", "Responder assigned successfully", "report", report));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReportStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        String role = currentUser.getRole();
        if (!"Barangay Captain".equalsIgnoreCase(role) && !"OFFICIAL".equalsIgnoreCase(role)
                && !"RESPONDER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only Captains, Officials, and Responders can update report status."));
        }

        EmergencyReport report = reportRepository.findById(id).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Report not found."));
        }

        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required."));
        }

        report.setStatus(newStatus);
        reportRepository.save(report);

        return ResponseEntity.ok(Map.of("message", "Report status updated successfully", "report", report));
    }
}

package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.AdminAuditLog;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.AdminAuditLogRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/verifications")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class AdminVerificationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    private User getAuthenticatedAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return null;

        User admin = userRepository.findByEmail(auth.getName()).orElse(null);
        if (admin == null)
            return null;

        // Ensure user has admin privileges. We'll allow "OFFICIAL" or "Super Admin"
        if (!"OFFICIAL".equals(admin.getRole()) && !"Super Admin".equals(admin.getRole())) {
            return null; // Not an admin
        }
        return admin;
    }

    @GetMapping
    public ResponseEntity<?> getCaptainApplications() {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        List<User> captains = userRepository.findByRoleOrderByIdDesc("Barangay Captain");
        return ResponseEntity.ok(captains);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getVerificationStats() {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        long pending = userRepository.countByRoleAndAccountStatus("Barangay Captain", "PENDING_VERIFICATION");
        long approved = userRepository.countByRoleAndAccountStatus("Barangay Captain", "APPROVED");
        long rejected = userRepository.countByRoleAndAccountStatus("Barangay Captain", "REJECTED");

        // Count unique barangays that have APPROVED captains
        List<User> allApprovedCaptains = userRepository.findByRoleOrderByIdDesc("Barangay Captain")
                .stream().filter(u -> "APPROVED".equals(u.getAccountStatus())).collect(Collectors.toList());
        long uniqueBarangays = allApprovedCaptains.stream()
                .map(User::getBarangayCode)
                .filter(code -> code != null && !code.isEmpty())
                .distinct()
                .count();

        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("registeredBarangays", uniqueBarangays);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveCaptain(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        User captain = userRepository.findById(id).orElse(null);
        if (captain == null || !"Barangay Captain".equals(captain.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application not found or invalid role"));
        }

        // Check if barangay already has an approved captain
        if (userRepository.existsByBarangayCodeAndRoleAndAccountStatus(captain.getBarangayCode(), "Barangay Captain",
                "APPROVED")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Barangay already has an approved captain."));
        }

        captain.setAccountStatus("APPROVED");
        userRepository.save(captain);

        logAction(admin.getId(), captain.getId(), "APPROVE", "Application approved successfully");

        return ResponseEntity.ok(Map.of("message", "Captain approved successfully"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectCaptain(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        User captain = userRepository.findById(id).orElse(null);
        if (captain == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application not found"));
        }

        String reason = payload.get("reason");
        captain.setAccountStatus("REJECTED");
        captain.setRejectionReason(reason);
        userRepository.save(captain);

        logAction(admin.getId(), captain.getId(), "REJECT", reason);

        return ResponseEntity.ok(Map.of("message", "Captain rejected successfully"));
    }

    @PostMapping("/{id}/request-docs")
    public ResponseEntity<?> requestDocs(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        User captain = userRepository.findById(id).orElse(null);
        if (captain == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application not found"));
        }

        String message = payload.get("message");
        captain.setAccountStatus("REQUEST_DOCS");
        captain.setAdditionalDocumentsMessage(message);
        userRepository.save(captain);

        logAction(admin.getId(), captain.getId(), "REQUEST_DOCS", message);

        return ResponseEntity.ok(Map.of("message", "Additional documents requested successfully"));
    }

    private void logAction(Long adminId, Long targetUserId, String actionType, String remarks) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(adminId);
        log.setTargetUserId(targetUserId);
        log.setActionType(actionType);
        log.setRemarks(remarks);
        auditLogRepository.save(log);
    }
}

package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.dto.DirectoryEntryDTO;
import edu.cit.quirante.readybarangay.model.AdminAuditLog;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.AdminAuditLogRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/directory")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class DirectoryController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<?> getDirectory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthenticated"));
        }

        // Audit Trail: Log when someone views the directory
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(currentUser.getId()); // Using adminId field for the viewer's ID
        log.setActionType("DIRECTORY_VIEW");
        log.setRemarks("User viewed the Community Directory for barangay: " + currentUser.getBarangay());
        auditLogRepository.save(log);

        // Get all residents in the same barangay
        List<User> residents = userRepository.findByBarangayCode(currentUser.getBarangayCode());

        List<DirectoryEntryDTO> directory = residents.stream()
                .map(u -> new DirectoryEntryDTO(
                        u.getFullName(),
                        u.getPurok(),
                        u.getRole(),
                        "APPROVED".equals(u.getAccountStatus())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(directory);
    }

    @PostMapping("/opt-in")
    public ResponseEntity<?> toggleOptIn(@RequestBody Map<String, Boolean> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthenticated"));
        }

        Boolean optIn = payload.get("optIn");
        if (optIn == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "optIn value is required"));
        }

        currentUser.setDirectoryOptIn(optIn);

        // Use the existing field if available, or just set it if we're also updating
        // purok
        if (currentUser.getPurok() == null || currentUser.getPurok().isEmpty()) {
            // If they are opting in, we might want to ensure they have a purok set
            // But for now let's just save the opt-in status
        }

        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "message", "Directory opt-in status updated",
                "optIn", currentUser.isDirectoryOptIn()));
    }

    @PutMapping("/purok")
    public ResponseEntity<?> updatePurok(@RequestBody Map<String, String> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(403).body(Map.of("message", "Unauthenticated"));
        }

        String purok = payload.get("purok");
        currentUser.setPurok(purok);
        userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "message", "Purok updated successfully",
                "purok", currentUser.getPurok()));
    }
}

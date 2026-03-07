package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.TransferRequest;
import edu.cit.quirante.readybarangay.model.TransferStatus;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.TransferRequestRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import edu.cit.quirante.readybarangay.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/transfers")
public class AdminTransferController {

    @Autowired
    private TransferService transferService;

    @Autowired
    private TransferRequestRepository transferRequestRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(email).orElse(null);
        if (admin == null)
            return null;

        if (!"OFFICIAL".equals(admin.getRole()) && !"Super Admin".equals(admin.getRole())) {
            return null; // Not an admin
        }
        return admin;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_OFFICIAL', 'ROLE_Super Admin')")
    public ResponseEntity<?> getPendingTransfers() {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        List<TransferRequest> pendingTransfers = transferRequestRepository
                .findByStatus(TransferStatus.NEW_CAPTAIN_PENDING_VERIFICATION);
        return ResponseEntity.ok(pendingTransfers);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_OFFICIAL', 'ROLE_Super Admin')")
    public ResponseEntity<?> approveTransfer(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        try {
            transferService.approveTransfer(id, admin);
            return ResponseEntity.ok(Map.of("message", "Transfer approved successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred during transfer approval: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_OFFICIAL', 'ROLE_Super Admin')")
    public ResponseEntity<?> rejectTransfer(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User admin = getAuthenticatedAdmin();
        if (admin == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        String reason = payload.get("reason");
        try {
            transferService.rejectTransfer(id, reason);
            return ResponseEntity.ok(Map.of("message", "Transfer rejected successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred during transfer rejection: " + e.getMessage()));
        }
    }
}

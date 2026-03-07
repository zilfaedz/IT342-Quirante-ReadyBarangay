package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.dto.TransferInitiationDto;
import edu.cit.quirante.readybarangay.model.TransferRequest;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import edu.cit.quirante.readybarangay.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("hasAuthority('ROLE_VERIFIED_CAPTAIN')")
    @PostMapping("/initiate")
    public ResponseEntity<?> initiateTransfer(
            @ModelAttribute TransferInitiationDto dto,
            @RequestParam("proofDocument") MultipartFile proofDocument) {

        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User oldCaptain = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Captain not found"));

            TransferRequest request = transferService.initiateTransfer(oldCaptain, dto, proofDocument);
            return ResponseEntity.ok(request);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during transfer initiation: " + e.getMessage());
        }
    }

    @PostMapping("/verify-new-captain")
    public ResponseEntity<?> verifyNewCaptain(
            @RequestParam("token") String token,
            @RequestParam("certificateOfProclamation") MultipartFile certOfProclamation,
            @RequestParam("governmentId") MultipartFile govtId,
            @RequestParam(value = "supportingDocument", required = false) MultipartFile supportingDoc) {

        try {
            TransferRequest request = transferService.verifyNewCaptain(token, certOfProclamation, govtId,
                    supportingDoc);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during new captain verification: " + e.getMessage());
        }
    }
}

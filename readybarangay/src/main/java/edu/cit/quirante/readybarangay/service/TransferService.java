package edu.cit.quirante.readybarangay.service;

import edu.cit.quirante.readybarangay.dto.TransferInitiationDto;
import edu.cit.quirante.readybarangay.model.CaptainHistory;
import edu.cit.quirante.readybarangay.model.TransferRequest;
import edu.cit.quirante.readybarangay.model.TransferStatus;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.CaptainHistoryRepository;
import edu.cit.quirante.readybarangay.repository.TransferRequestRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;
import java.util.Optional;

@Service
public class TransferService {

    @Autowired
    private TransferRequestRepository transferRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaptainHistoryRepository captainHistoryRepository;

    @Autowired
    private EmailService emailService;

    private static final String UPLOAD_DIR = "uploads/transfers/";

    public TransferRequest initiateTransfer(User oldCaptain, TransferInitiationDto dto, MultipartFile proofDocument)
            throws IOException {
        // Prevent duplicate active transfers
        boolean hasActiveRequest = transferRequestRepository.existsByBarangayCodeAndStatusIn(
                oldCaptain.getBarangayCode(),
                Arrays.asList(TransferStatus.TRANSFER_PENDING_ADMIN_APPROVAL,
                        TransferStatus.NEW_CAPTAIN_PENDING_VERIFICATION));

        if (hasActiveRequest) {
            throw new IllegalStateException("An active transfer request already exists for this barangay.");
        }

        TransferRequest request = new TransferRequest();
        request.setOldCaptain(oldCaptain);
        request.setBarangayCode(oldCaptain.getBarangayCode());
        request.setBarangayName(oldCaptain.getBarangay());

        request.setNewCaptainName(dto.getNewCaptainName());
        request.setNewCaptainEmail(dto.getNewCaptainEmail());
        request.setNewCaptainContactNumber(dto.getNewCaptainContactNumber());

        if (proofDocument != null && !proofDocument.isEmpty()) {
            request.setProofDocumentUrl(saveFile(proofDocument, "proof_" + System.currentTimeMillis()));
        }

        // Generate token and set status
        String token = UUID.randomUUID().toString();
        request.setToken(token);
        // Step 1 status matching instructions
        request.setStatus(TransferStatus.TRANSFER_PENDING_ADMIN_APPROVAL);

        TransferRequest savedRequest = transferRequestRepository.save(request);

        // Send Email
        try {
            emailService.sendTransferNominationEmail(
                    savedRequest.getNewCaptainEmail(),
                    savedRequest.getBarangayName(),
                    token);
        } catch (Exception e) {
            // Log but don't fail the transaction if email fails in local dev
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return savedRequest;
    }

    public TransferRequest verifyNewCaptain(String token, MultipartFile certOfProclamation, MultipartFile govtId,
            MultipartFile supportingDoc) throws IOException {
        TransferRequest request = transferRequestRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired transfer token."));

        if (request.getStatus() != TransferStatus.TRANSFER_PENDING_ADMIN_APPROVAL) {
            throw new IllegalStateException("This transfer request is not pending verification.");
        }

        if (certOfProclamation != null && !certOfProclamation.isEmpty()) {
            request.setCertificateOfProclamationUrl(saveFile(certOfProclamation, "cert_" + System.currentTimeMillis()));
        }

        if (govtId != null && !govtId.isEmpty()) {
            request.setGovernmentIdUrl(saveFile(govtId, "gov_" + System.currentTimeMillis()));
        }

        if (supportingDoc != null && !supportingDoc.isEmpty()) {
            request.setSupportingDocumentUrl(saveFile(supportingDoc, "supp_" + System.currentTimeMillis()));
        }

        request.setStatus(TransferStatus.NEW_CAPTAIN_PENDING_VERIFICATION);
        return transferRequestRepository.save(request);
    }

    @Transactional
    public void approveTransfer(Long requestId, User adminUser) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer request not found."));

        if (request.getStatus() != TransferStatus.NEW_CAPTAIN_PENDING_VERIFICATION) {
            throw new IllegalStateException("Transfer is not ready for admin approval.");
        }

        // Find new captain user by email
        Optional<User> newCaptainOpt = userRepository.findByEmail(request.getNewCaptainEmail());
        if (!newCaptainOpt.isPresent()) {
            throw new IllegalStateException("New captain must create an account first.");
        }
        User newCaptain = newCaptainOpt.get();

        // Update Old Captain Status
        User oldCaptain = request.getOldCaptain();
        oldCaptain.setRole("FORMER_CAPTAIN");
        userRepository.save(oldCaptain);

        // Update New Captain Status
        newCaptain.setRole("VERIFIED_CAPTAIN");
        newCaptain.setBarangayCode(request.getBarangayCode());
        newCaptain.setBarangay(request.getBarangayName());
        userRepository.save(newCaptain);

        // Update Request Status
        request.setStatus(TransferStatus.TRANSFER_APPROVED);
        transferRequestRepository.save(request);

        // Save Captain History
        CaptainHistory history = new CaptainHistory();
        history.setBarangayCode(request.getBarangayCode());
        history.setBarangayName(request.getBarangayName());
        history.setOldCaptain(oldCaptain);
        history.setNewCaptain(newCaptain);
        history.setApprovedByAdmin(adminUser);
        captainHistoryRepository.save(history);
    }

    @Transactional
    public void rejectTransfer(Long requestId, String reason) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer request not found."));

        request.setStatus(TransferStatus.TRANSFER_REJECTED);
        transferRequestRepository.save(request);

        // Notify both via email
        try {
            emailService.sendTransferRejectionEmail(request.getNewCaptainEmail(), request.getBarangayName(), reason);
            if (request.getOldCaptain() != null) {
                emailService.sendTransferRejectionEmail(request.getOldCaptain().getEmail(), request.getBarangayName(),
                        reason);
            }
        } catch (Exception e) {
            System.err.println("Failed to send rejection emails: " + e.getMessage());
        }
    }

    private String saveFile(MultipartFile file, String prefix) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = prefix + extension;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        return filename;
    }
}

package edu.cit.quirante.readybarangay.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String barangayCode;

    @Column(nullable = false)
    private String barangayName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_captain_id", nullable = false)
    @JsonIgnore
    private User oldCaptain;

    @Column(nullable = false)
    private String newCaptainName;

    @Column(nullable = false)
    private String newCaptainEmail;

    @Column(nullable = false)
    private String newCaptainContactNumber;

    @Column(nullable = false)
    private String proofDocumentUrl; // By new election/resolution (uploaded by old captain)

    @Column(nullable = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status;

    // Fields submitted by new captain during verification
    private String certificateOfProclamationUrl;
    private String governmentIdUrl;
    private String supportingDocumentUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBarangayCode() {
        return barangayCode;
    }

    public void setBarangayCode(String barangayCode) {
        this.barangayCode = barangayCode;
    }

    public String getBarangayName() {
        return barangayName;
    }

    public void setBarangayName(String barangayName) {
        this.barangayName = barangayName;
    }

    public User getOldCaptain() {
        return oldCaptain;
    }

    public void setOldCaptain(User oldCaptain) {
        this.oldCaptain = oldCaptain;
    }

    public String getNewCaptainName() {
        return newCaptainName;
    }

    public void setNewCaptainName(String newCaptainName) {
        this.newCaptainName = newCaptainName;
    }

    public String getNewCaptainEmail() {
        return newCaptainEmail;
    }

    public void setNewCaptainEmail(String newCaptainEmail) {
        this.newCaptainEmail = newCaptainEmail;
    }

    public String getNewCaptainContactNumber() {
        return newCaptainContactNumber;
    }

    public void setNewCaptainContactNumber(String newCaptainContactNumber) {
        this.newCaptainContactNumber = newCaptainContactNumber;
    }

    public String getProofDocumentUrl() {
        return proofDocumentUrl;
    }

    public void setProofDocumentUrl(String proofDocumentUrl) {
        this.proofDocumentUrl = proofDocumentUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public TransferStatus getStatus() {
        return status;
    }

    public void setStatus(TransferStatus status) {
        this.status = status;
    }

    public String getCertificateOfProclamationUrl() {
        return certificateOfProclamationUrl;
    }

    public void setCertificateOfProclamationUrl(String certificateOfProclamationUrl) {
        this.certificateOfProclamationUrl = certificateOfProclamationUrl;
    }

    public String getGovernmentIdUrl() {
        return governmentIdUrl;
    }

    public void setGovernmentIdUrl(String governmentIdUrl) {
        this.governmentIdUrl = governmentIdUrl;
    }

    public String getSupportingDocumentUrl() {
        return supportingDocumentUrl;
    }

    public void setSupportingDocumentUrl(String supportingDocumentUrl) {
        this.supportingDocumentUrl = supportingDocumentUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

package edu.cit.quirante.readybarangay.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "captain_history")
public class CaptainHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String barangayCode;

    @Column(nullable = false)
    private String barangayName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_captain_id", nullable = true)
    @JsonIgnore
    private User oldCaptain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_captain_id", nullable = false)
    @JsonIgnore
    private User newCaptain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_admin_id", nullable = false)
    @JsonIgnore
    private User approvedByAdmin;

    @Column(name = "transfer_date", nullable = false)
    private LocalDateTime transferDate;

    public CaptainHistory() {
        this.transferDate = LocalDateTime.now();
    }

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

    public User getNewCaptain() {
        return newCaptain;
    }

    public void setNewCaptain(User newCaptain) {
        this.newCaptain = newCaptain;
    }

    public User getApprovedByAdmin() {
        return approvedByAdmin;
    }

    public void setApprovedByAdmin(User approvedByAdmin) {
        this.approvedByAdmin = approvedByAdmin;
    }

    public LocalDateTime getTransferDate() {
        return transferDate;
    }

    public void setTransferDate(LocalDateTime transferDate) {
        this.transferDate = transferDate;
    }
}

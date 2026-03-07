package edu.cit.quirante.readybarangay.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "barangay_captains")
public class BarangayCaptain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String dateOfBirth;
    private String governmentIdUrl;
    private String certificateOfAppointmentUrl;
    private String barangayResolutionUrl;
    private String selfieUrl;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGovernmentIdUrl() {
        return governmentIdUrl;
    }

    public void setGovernmentIdUrl(String governmentIdUrl) {
        this.governmentIdUrl = governmentIdUrl;
    }

    public String getCertificateOfAppointmentUrl() {
        return certificateOfAppointmentUrl;
    }

    public void setCertificateOfAppointmentUrl(String certificateOfAppointmentUrl) {
        this.certificateOfAppointmentUrl = certificateOfAppointmentUrl;
    }

    public String getBarangayResolutionUrl() {
        return barangayResolutionUrl;
    }

    public void setBarangayResolutionUrl(String barangayResolutionUrl) {
        this.barangayResolutionUrl = barangayResolutionUrl;
    }

    public String getSelfieUrl() {
        return selfieUrl;
    }

    public void setSelfieUrl(String selfieUrl) {
        this.selfieUrl = selfieUrl;
    }
}

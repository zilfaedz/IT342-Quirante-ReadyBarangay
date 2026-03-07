package edu.cit.quirante.readybarangay.dto;

public class DirectoryEntryDTO {
    private String fullName;
    private String purok;
    private String role;
    private boolean verified;

    public DirectoryEntryDTO(String fullName, String purok, String role, boolean verified) {
        this.fullName = fullName;
        this.purok = purok;
        this.role = role;
        this.verified = verified;
    }

    // Getters and Setters
    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPurok() {
        return purok;
    }

    public void setPurok(String purok) {
        this.purok = purok;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }
}

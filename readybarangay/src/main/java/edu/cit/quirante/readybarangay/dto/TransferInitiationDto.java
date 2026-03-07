package edu.cit.quirante.readybarangay.dto;

public class TransferInitiationDto {
    private String newCaptainName;
    private String newCaptainEmail;
    private String newCaptainContactNumber;

    // Getters and Setter
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
}

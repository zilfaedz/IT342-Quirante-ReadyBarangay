package edu.cit.quirante.readybarangay.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public void sendTransferNominationEmail(String toEmail, String barangayName, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Nomination as New Barangay Captain for " + barangayName);

        String verificationLink = frontendUrl + "/verify-transfer/" + token;

        message.setText(
                "Hello,\n\n" +
                        "You've been nominated as the new Barangay Captain of " + barangayName + ".\n\n" +
                        "Please complete your verification by clicking the link below and uploading your Certificate of Proclamation and Government ID:\n"
                        +
                        verificationLink + "\n\n" +
                        "Thank you,\n" +
                        "ReadyBarangay System");

        mailSender.send(message);
    }

    public void sendTransferRejectionEmail(String toEmail, String barangayName, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Captain Transfer Rejected for " + barangayName);

        message.setText(
                "Hello,\n\n" +
                        "The captain ownership transfer for " + barangayName
                        + " has been rejected by the administrator.\n\n" +
                        "Reason: " + (reason != null ? reason : "Not provided.") + "\n\n" +
                        "Thank you,\n" +
                        "ReadyBarangay System");

        mailSender.send(message);
    }
}

package edu.cit.quirante.readybarangay.config;

import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@readybarangay.com";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            admin.setFullName("Super Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("admin123")); // Default password
            admin.setRole("Super Admin");
            admin.setAccountStatus("APPROVED");

            userRepository.save(admin);
            System.out.println("Default Super Admin account created: " + adminEmail + " / admin123");
        } else {
            System.out.println("Super Admin account already exists.");
        }
    }
}

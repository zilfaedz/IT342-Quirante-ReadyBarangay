package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.model.BarangayCaptain;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import edu.cit.quirante.readybarangay.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" }) // Allow frontend
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("phone") String phone,
            @RequestParam("dateOfBirth") String dateOfBirth,
            @RequestParam("gender") String gender,
            @RequestParam(value = "emergencyContactName", required = false) String emergencyContactName,
            @RequestParam(value = "emergencyContactRelationship", required = false) String emergencyContactRelationship,
            @RequestParam(value = "emergencyContactPhone", required = false) String emergencyContactPhone,
            @RequestParam(value = "bloodType", required = false) String bloodType,
            @RequestParam("barangayCode") String barangayCode,
            @RequestParam("barangay") String barangay,
            @RequestParam("cityName") String cityName,
            @RequestParam("cityCode") String cityCode,
            @RequestParam("provinceName") String provinceName,
            @RequestParam("provinceCode") String provinceCode,
            @RequestParam("regionName") String regionName,
            @RequestParam("regionCode") String regionCode,
            @RequestParam(value = "street", required = false) String street,
            @RequestParam(value = "lotBlockNumber", required = false) String lotBlockNumber,
            @RequestParam(value = "validId", required = false) MultipartFile validId) {

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }

        // Check if there is an approved captain for this barangay
        if (!userRepository.existsByBarangayCodeAndRoleAndAccountStatus(barangayCode, "Barangay Captain",
                "APPROVED")) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Your barangay hasn't been registered yet. Please consult with your barangay captain about registering your barangay first."));
        }

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setContactNumber(phone);
        user.setRole("RESIDENT");
        user.setAccountStatus("APPROVED"); // Default for residents unless review is required

        // New Fields
        user.setDateOfBirth(dateOfBirth);
        user.setGender(gender);
        user.setEmergencyContactName(emergencyContactName);
        user.setEmergencyContactRelationship(emergencyContactRelationship);
        user.setEmergencyContactPhone(emergencyContactPhone);
        user.setBloodType(bloodType);

        // Location
        user.setBarangayCode(barangayCode);
        user.setBarangay(barangay);
        user.setCityName(cityName);
        user.setCityCode(cityCode);
        user.setProvinceName(provinceName);
        user.setProvinceCode(provinceCode);
        user.setRegionName(regionName);
        user.setRegionCode(regionCode);
        user.setStreet(street);
        user.setLotBlockNumber(lotBlockNumber);

        // Handle File Upload
        if (validId != null && !validId.isEmpty()) {
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);
            try {
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                user.setValidIdUrl(saveFile(validId, uploadPath));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("message", "Failed to process ID upload."));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/register-captain")
    public ResponseEntity<?> registerCaptain(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("dateOfBirth") String dateOfBirth,
            @RequestParam("barangayCode") String barangayCode,
            @RequestParam("barangay") String barangay,
            @RequestParam("cityName") String cityName,
            @RequestParam("cityCode") String cityCode,
            @RequestParam("provinceName") String provinceName,
            @RequestParam("provinceCode") String provinceCode,
            @RequestParam("regionName") String regionName,
            @RequestParam("regionCode") String regionCode,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam(value = "emergencyContactName", required = false) String emergencyContactName,
            @RequestParam(value = "emergencyContactRelationship", required = false) String emergencyContactRelationship,
            @RequestParam(value = "emergencyContactPhone", required = false) String emergencyContactPhone,
            @RequestParam(value = "bloodType", required = false) String bloodType,
            @RequestParam(value = "governmentId", required = false) MultipartFile governmentId,
            @RequestParam(value = "certificateOfAppointment", required = false) MultipartFile certificateOfAppointment,
            @RequestParam(value = "barangayResolution", required = false) MultipartFile barangayResolution,
            @RequestParam(value = "selfie", required = false) MultipartFile selfie) {

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }

        // Check one captain per barangay rule
        if (userRepository.existsByBarangayCodeAndRoleAndAccountStatus(barangayCode, "Barangay Captain", "APPROVED")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Barangay already has an approved captain."));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("Barangay Captain");
        user.setAccountStatus("PENDING_VERIFICATION");

        // Set Personal Info
        user.setFullName(name);
        String[] nameParts = name.split(" ", 2);
        user.setFirstName(nameParts[0]);
        if (nameParts.length > 1) {
            user.setLastName(nameParts[1]);
        }
        user.setContactNumber(phone);
        user.setGender(gender);
        user.setEmergencyContactName(emergencyContactName);
        user.setEmergencyContactRelationship(emergencyContactRelationship);
        user.setEmergencyContactPhone(emergencyContactPhone);
        user.setBloodType(bloodType);

        // Set Location
        user.setBarangay(barangay);
        user.setBarangayCode(barangayCode);
        user.setCityName(cityName);
        user.setCityCode(cityCode);
        user.setProvinceName(provinceName);
        user.setProvinceCode(provinceCode);
        user.setRegionName(regionName);
        user.setRegionCode(regionCode);

        // Create BarangayCaptain details
        BarangayCaptain captain = new BarangayCaptain();
        captain.setUser(user);
        captain.setDateOfBirth(dateOfBirth);
        user.setDateOfBirth(dateOfBirth);
        user.setCaptainDetails(captain);

        // Handle File Uploads
        String uploadDir = "uploads/";
        Path uploadPath = Paths.get(uploadDir);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            if (governmentId != null && !governmentId.isEmpty()) {
                captain.setGovernmentIdUrl(saveFile(governmentId, uploadPath));
            }
            if (certificateOfAppointment != null && !certificateOfAppointment.isEmpty()) {
                captain.setCertificateOfAppointmentUrl(saveFile(certificateOfAppointment, uploadPath));
            }
            if (barangayResolution != null && !barangayResolution.isEmpty()) {
                captain.setBarangayResolutionUrl(saveFile(barangayResolution, uploadPath));
            }
            if (selfie != null && !selfie.isEmpty()) {
                captain.setSelfieUrl(saveFile(selfie, uploadPath));
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to process document uploads."));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Registration submitted for verification."));
    }

    @PostMapping("/complete-onboarding")
    public ResponseEntity<?> completeOnboarding(
            @RequestParam("email") String email,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam("householdRole") String householdRole,
            @RequestParam("householdSize") String householdSize,
            @RequestParam("numberOfChildren") String numberOfChildren,
            @RequestParam("seniorCitizenPresent") String seniorCitizenPresent,
            @RequestParam("pwdPresent") String pwdPresent,
            @RequestParam("pets") String pets,
            @RequestParam("medicalConditions") String medicalConditions,
            @RequestParam("bloodType") String bloodType,
            @RequestParam(value = "emergencyContactName", required = false) String emergencyContactName,
            @RequestParam(value = "emergencyContactRelationship", required = false) String emergencyContactRelationship,
            @RequestParam(value = "emergencyContactPhone", required = false) String emergencyContactPhone,
            @RequestParam(value = "profilePicture", required = false) MultipartFile profilePicture) {

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOptional.get();
        user.setBio(bio);
        user.setHouseholdRole(householdRole);
        user.setHouseholdSize(householdSize);
        user.setNumberOfChildren(numberOfChildren);
        user.setSeniorCitizenPresent(seniorCitizenPresent);
        user.setPwdPresent(pwdPresent);
        user.setPets(pets);
        user.setMedicalConditions(medicalConditions);
        user.setBloodType(bloodType);
        user.setEmergencyContactName(emergencyContactName);
        user.setEmergencyContactRelationship(emergencyContactRelationship);
        user.setEmergencyContactPhone(emergencyContactPhone);
        user.setOnboardingCompleted(true);

        if (profilePicture != null && !profilePicture.isEmpty()) {
            try {
                Path uploadPath = Paths.get("uploads/");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                user.setProfilePictureUrl(saveFile(profilePicture, uploadPath));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload profile picture"));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Onboarding completed successfully", "onboardingCompleted", true));
    }

    @PostMapping("/skip-onboarding")
    public ResponseEntity<?> skipOnboarding() {
        // Get the currently authenticated user from the JWT token
        // We'll use the Spring Security context instead
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        String email = auth.getName();
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOptional.get();
        user.setOnboardingCompleted(true);
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Onboarding skipped", "onboardingCompleted", true));
    }

    private String saveFile(MultipartFile file, Path uploadPath) throws IOException {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(newFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + newFileName;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        // Try to find user by email
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "This email is not registered with ReadyBarangay."));
        }

        if (passwordEncoder.matches(password, userOptional.get().getPassword())) {
            User user = userOptional.get();

            // Check Account Status
            if ("PENDING_VERIFICATION".equalsIgnoreCase(user.getAccountStatus())) {
                return ResponseEntity.status(403).body(Map.of("message",
                        "Your registration is under review. You will be notified once verification is complete."));
            } else if ("REJECTED".equalsIgnoreCase(user.getAccountStatus())) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Your registration was rejected. Reason: " + user.getRejectionReason()));
            } else if ("REQUEST_DOCS".equalsIgnoreCase(user.getAccountStatus())) {
                return ResponseEntity.status(403).body(Map.of("message",
                        "Additional documents are required: " + user.getAdditionalDocumentsMessage()));
            }

            String token = jwtUtil.generateToken(user.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("firstName", user.getFirstName() != null ? user.getFirstName() : "");
            response.put("lastName", user.getLastName() != null ? user.getLastName() : "");
            response.put("fullName", user.getFullName() != null ? user.getFullName() : "");
            response.put("address", user.getAddress() != null ? user.getAddress() : "");
            response.put("contactNumber", user.getContactNumber() != null ? user.getContactNumber() : "");
            response.put("barangay", user.getBarangay() != null ? user.getBarangay() : "");
            response.put("barangayCode", user.getBarangayCode() != null ? user.getBarangayCode() : "");
            response.put("cityName", user.getCityName() != null ? user.getCityName() : "");
            response.put("cityCode", user.getCityCode() != null ? user.getCityCode() : "");
            response.put("provinceName", user.getProvinceName() != null ? user.getProvinceName() : "");
            response.put("provinceCode", user.getProvinceCode() != null ? user.getProvinceCode() : "");
            response.put("regionName", user.getRegionName() != null ? user.getRegionName() : "");
            response.put("regionCode", user.getRegionCode() != null ? user.getRegionCode() : "");
            response.put("street", user.getStreet() != null ? user.getStreet() : "");
            response.put("lotBlockNumber",
                    user.getLotBlockNumber() != null ? user.getLotBlockNumber() : "");
            response.put("profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "");

            if ("RESIDENT".equalsIgnoreCase(user.getRole()) || "OFFICIAL".equalsIgnoreCase(user.getRole())
                    || "Tanod".equalsIgnoreCase(user.getRole())) {
                Optional<User> captainOpt = userRepository.findFirstByBarangayCodeAndRoleAndAccountStatusOrderByIdDesc(
                        user.getBarangayCode(), "Barangay Captain", "APPROVED");
                if (captainOpt.isPresent()) {
                    response.put("captainName", captainOpt.get().getFullName());
                } else {
                    response.put("captainName", "Not Assigned");
                }
            } else if ("Barangay Captain".equalsIgnoreCase(user.getRole())) {
                response.put("captainName", user.getFullName());
            }

            response.put("onboardingCompleted", user.isOnboardingCompleted());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid password. Please try again."));
    }
}

package edu.cit.quirante.readybarangay.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String firstName;
    private String lastName;
    private String fullName;
    private String address;
    private String contactNumber;
    private String barangay;
    private String barangayCode;
    private String cityName;
    private String cityCode;
    private String provinceName;
    private String provinceCode;
    private String regionName;
    private String regionCode;
    private String street;
    private String lotBlockNumber;

    @Column(nullable = false)
    private String role = "RESIDENT"; // default role

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private BarangayCaptain captainDetails;

    @Column(nullable = false)
    private String accountStatus = "APPROVED"; // Default to APPROVED for existing users / roles
    private String rejectionReason;
    private String additionalDocumentsMessage;

    private String purok;
    @Column(nullable = true)
    private Boolean directoryOptIn = false;

    @Column(nullable = false)
    private String profileVisibility = "OFFICIALS"; // DEFAULT: OFFICIALS, RESIDENTS, PRIVATE

    // New Fields
    private String dateOfBirth;
    private String gender;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
    private String bloodType;
    private String validIdUrl;
    @Column(nullable = true)
    private String bio = "";
    @Column(nullable = true)
    private String householdRole = "";
    @Column(nullable = true)
    private String householdSize = "1";
    @Column(nullable = true)
    private String numberOfChildren = "0";
    @Column(name = "has_senior_citizen", nullable = true)
    private String seniorCitizenPresent = "No";
    @Column(name = "haspwd", nullable = true)
    private String pwdPresent = "No";
    @Column(nullable = true)
    private String pets = "No";
    @Column(nullable = true)
    private String medicalConditions = "";
    @Column(nullable = true)
    private String additionalNotes = "";
    @Column(nullable = true)
    private String profilePictureUrl = "";
    @Column(name = "is_onboarded", nullable = true)
    private Boolean onboardingCompleted = false;

    @Column(name = "onboarding_completed", nullable = true)
    private Boolean onboardingCompletedLegacy = false;

    @Column(name = "pwd_present", nullable = true)
    private String pwdPresentLegacy;

    @Column(name = "senior_citizen_present", nullable = true)
    private String seniorCitizenPresentLegacy;

    @Transient
    private String captainName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public String getBarangay() {
        return barangay;
    }

    public void setBarangay(String barangay) {
        this.barangay = barangay;
    }

    public String getBarangayCode() {
        return barangayCode;
    }

    public void setBarangayCode(String barangayCode) {
        this.barangayCode = barangayCode;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public String getCityCode() {
        return cityCode;
    }

    public void setCityCode(String cityCode) {
        this.cityCode = cityCode;
    }

    public String getProvinceName() {
        return provinceName;
    }

    public void setProvinceName(String provinceName) {
        this.provinceName = provinceName;
    }

    public String getProvinceCode() {
        return provinceCode;
    }

    public void setProvinceCode(String provinceCode) {
        this.provinceCode = provinceCode;
    }

    public String getRegionName() {
        return regionName;
    }

    public void setRegionName(String regionName) {
        this.regionName = regionName;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getLotBlockNumber() {
        return lotBlockNumber;
    }

    public void setLotBlockNumber(String lotBlockNumber) {
        this.lotBlockNumber = lotBlockNumber;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public BarangayCaptain getCaptainDetails() {
        return captainDetails;
    }

    public void setCaptainDetails(BarangayCaptain captainDetails) {
        this.captainDetails = captainDetails;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getAdditionalDocumentsMessage() {
        return additionalDocumentsMessage;
    }

    public void setAdditionalDocumentsMessage(String additionalDocumentsMessage) {
        this.additionalDocumentsMessage = additionalDocumentsMessage;
    }

    public String getPurok() {
        return purok;
    }

    public void setPurok(String purok) {
        this.purok = purok;
    }

    public Boolean isDirectoryOptIn() {
        return directoryOptIn;
    }

    public void setDirectoryOptIn(Boolean directoryOptIn) {
        this.directoryOptIn = directoryOptIn;
    }

    public String getCaptainName() {
        return captainName;
    }

    public void setCaptainName(String captainName) {
        this.captainName = captainName;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    public String getEmergencyContactRelationship() {
        return emergencyContactRelationship;
    }

    public void setEmergencyContactRelationship(String emergencyContactRelationship) {
        this.emergencyContactRelationship = emergencyContactRelationship;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }

    public String getBloodType() {
        return bloodType;
    }

    public void setBloodType(String bloodType) {
        this.bloodType = bloodType;
    }

    public String getValidIdUrl() {
        return validIdUrl;
    }

    public void setValidIdUrl(String validIdUrl) {
        this.validIdUrl = validIdUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getHouseholdRole() {
        return householdRole;
    }

    public void setHouseholdRole(String householdRole) {
        this.householdRole = householdRole;
    }

    public String getHouseholdSize() {
        return householdSize;
    }

    public void setHouseholdSize(String householdSize) {
        this.householdSize = householdSize;
    }

    public String getNumberOfChildren() {
        return numberOfChildren;
    }

    public void setNumberOfChildren(String numberOfChildren) {
        this.numberOfChildren = numberOfChildren;
    }

    public String getSeniorCitizenPresent() {
        return seniorCitizenPresent;
    }

    public void setSeniorCitizenPresent(String seniorCitizenPresent) {
        this.seniorCitizenPresent = seniorCitizenPresent;
    }

    public String getPwdPresent() {
        return pwdPresent;
    }

    public void setPwdPresent(String pwdPresent) {
        this.pwdPresent = pwdPresent;
    }

    public String getPets() {
        return pets;
    }

    public void setPets(String pets) {
        this.pets = pets;
    }

    public String getMedicalConditions() {
        return medicalConditions;
    }

    public void setMedicalConditions(String medicalConditions) {
        this.medicalConditions = medicalConditions;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public Boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(Boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public String getProfileVisibility() {
        return profileVisibility;
    }

    public void setProfileVisibility(String profileVisibility) {
        this.profileVisibility = profileVisibility;
    }

    @PrePersist
    @PreUpdate
    private void updateFullName() {
        this.fullName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        this.fullName = this.fullName.trim();
    }
}

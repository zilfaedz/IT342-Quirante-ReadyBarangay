package edu.cit.quirante.readybarangay.controller;

import edu.cit.quirante.readybarangay.model.EvacuationCenter;
import edu.cit.quirante.readybarangay.model.User;
import edu.cit.quirante.readybarangay.repository.EvacuationCenterRepository;
import edu.cit.quirante.readybarangay.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/evacuation-centers")
public class EvacuationCenterController {

    @Autowired
    private EvacuationCenterRepository centerRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all centers (Public)
    @GetMapping
    public ResponseEntity<List<EvacuationCenter>> getAllCenters() {
        return ResponseEntity.ok(centerRepository.findAll());
    }

    // Scoped centers for authenticated residents/users:
    // - barangay: centers created by Barangay Captains of the same barangay
    // - province: centers created by Barangay Captains in the same province
    @GetMapping("/scoped")
    public ResponseEntity<?> getScopedCenters(@RequestParam(value = "scope", defaultValue = "province") String scope) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        String normalizedScope = scope == null ? "province" : scope.trim().toLowerCase(Locale.ROOT);
        String userBarangayCode = currentUser.getBarangayCode();
        String userProvinceCode = currentUser.getProvinceCode();

        List<EvacuationCenter> centers = centerRepository.findAll().stream()
                .filter(c -> "Barangay Captain".equalsIgnoreCase(c.getCreatedByRole()))
                .filter(c -> {
                    if ("barangay".equals(normalizedScope)) {
                        return userBarangayCode != null && c.getBarangayCode() != null
                                && userBarangayCode.equals(c.getBarangayCode());
                    }
                    return userProvinceCode != null && c.getProvinceCode() != null
                            && userProvinceCode.equals(c.getProvinceCode());
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(centers);
    }

    // Create new center (Captain/Official)
    @PostMapping
    public ResponseEntity<?> createCenter(
            @RequestParam("name") String name,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("capacity") Integer capacity,
            @RequestParam(value = "currentOccupancy", defaultValue = "0") Integer currentOccupancy,
            @RequestParam(value = "status", defaultValue = "Open") String status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);

        EvacuationCenter center = new EvacuationCenter();
        center.setName(name);
        center.setLatitude(latitude);
        center.setLongitude(longitude);
        center.setCapacity(capacity);
        center.setCurrentOccupancy(currentOccupancy);
        center.setStatus(status);
        if (currentUser != null) {
            center.setBarangayCode(currentUser.getBarangayCode());
            center.setBarangayName(currentUser.getBarangay());
            center.setCityCode(currentUser.getCityCode());
            center.setCityName(currentUser.getCityName());
            center.setProvinceCode(currentUser.getProvinceCode());
            center.setProvinceName(currentUser.getProvinceName());
            center.setCreatedByUserId(currentUser.getId());
            center.setCreatedByRole(currentUser.getRole());
        }

        centerRepository.save(center);
        return ResponseEntity.status(HttpStatus.CREATED).body(center);
    }

    // Update center occupancy / status (Captain/Official)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCenter(
            @PathVariable Long id,
            @RequestParam(value = "currentOccupancy", required = false) Integer currentOccupancy,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "capacity", required = false) Integer capacity) {

        Optional<EvacuationCenter> optionalCenter = centerRepository.findById(id);
        if (optionalCenter.isPresent()) {
            EvacuationCenter center = optionalCenter.get();
            if (currentOccupancy != null)
                center.setCurrentOccupancy(currentOccupancy);
            if (status != null)
                center.setStatus(status);
            if (capacity != null)
                center.setCapacity(capacity);

            centerRepository.save(center);
            return ResponseEntity.ok(center);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evacuation Center not found.");
        }
    }

    // Delete center (Captain/Official)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCenter(@PathVariable Long id) {
        if (centerRepository.existsById(id)) {
            centerRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evacuation Center not found.");
        }
    }
}

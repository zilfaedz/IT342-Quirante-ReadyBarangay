package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.EmergencyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmergencyReportRepository extends JpaRepository<EmergencyReport, Long> {
    List<EmergencyReport> findAllByOrderByCreatedAtDesc();

    List<EmergencyReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<EmergencyReport> findByUserBarangayCodeOrderByCreatedAtDesc(String barangayCode);

    long countByUserBarangayCode(String barangayCode);
}

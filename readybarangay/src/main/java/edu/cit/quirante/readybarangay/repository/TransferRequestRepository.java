package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.TransferRequest;
import edu.cit.quirante.readybarangay.model.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {
    Optional<TransferRequest> findByToken(String token);

    // Check for active requests, allowing us to prevent duplicates per barangay
    boolean existsByBarangayCodeAndStatusIn(String barangayCode, List<TransferStatus> statuses);

    List<TransferRequest> findByStatus(TransferStatus status);
}

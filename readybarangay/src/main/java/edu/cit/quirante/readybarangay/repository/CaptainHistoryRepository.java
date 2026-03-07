package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.CaptainHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaptainHistoryRepository extends JpaRepository<CaptainHistory, Long> {
    List<CaptainHistory> findByBarangayCodeOrderByTransferDateDesc(String barangayCode);
}

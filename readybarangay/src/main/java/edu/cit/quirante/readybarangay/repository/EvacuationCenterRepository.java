package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.EvacuationCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvacuationCenterRepository extends JpaRepository<EvacuationCenter, Long> {
}

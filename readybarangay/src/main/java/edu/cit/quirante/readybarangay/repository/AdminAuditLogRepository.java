package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findByTargetUserIdOrderByTimestampDesc(Long targetUserId);
}

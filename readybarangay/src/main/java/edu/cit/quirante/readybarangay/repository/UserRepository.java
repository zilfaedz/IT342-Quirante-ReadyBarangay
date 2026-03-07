package edu.cit.quirante.readybarangay.repository;

import edu.cit.quirante.readybarangay.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByBarangayCodeAndRoleAndAccountStatus(String barangayCode, String role, String accountStatus);

    Optional<User> findFirstByBarangayCodeAndRoleAndAccountStatusOrderByIdDesc(String barangayCode, String role,
            String accountStatus);

    List<User> findByRoleOrderByIdDesc(String role);

    List<User> findByBarangayCode(String barangayCode);

    List<User> findByBarangayCodeAndDirectoryOptInTrue(String barangayCode);

    long countByRole(String role);

    long countByRoleAndAccountStatus(String role, String accountStatus);

    long countByBarangayCodeAndRoleAndAccountStatus(String barangayCode, String role, String accountStatus);

    long countByBarangayCodeAndRoleInAndAccountStatus(String barangayCode, List<String> roles, String accountStatus);
}

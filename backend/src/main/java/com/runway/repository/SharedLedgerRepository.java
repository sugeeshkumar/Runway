package com.runway.repository;

import com.runway.entity.SharedLedger;
import com.runway.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharedLedgerRepository extends JpaRepository<SharedLedger, UUID> {
    List<SharedLedger> findByOwnerOrderByCreatedAtDesc(User owner);

    @Query("SELECT DISTINCT l FROM SharedLedger l LEFT JOIN l.participants p WHERE l.owner = :user OR p.linkedUser = :user ORDER BY l.createdAt DESC")
    List<SharedLedger> findAllForUser(@Param("user") User user);
}

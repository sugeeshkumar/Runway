package com.runway.repository;

import com.runway.entity.LedgerParticipant;
import com.runway.entity.SharedLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerParticipantRepository extends JpaRepository<LedgerParticipant, UUID> {
    List<LedgerParticipant> findByLedger(SharedLedger ledger);
}

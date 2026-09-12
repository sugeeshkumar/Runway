package com.runway.repository;

import com.runway.entity.SharedExpense;
import com.runway.entity.SharedLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharedExpenseRepository extends JpaRepository<SharedExpense, UUID> {
    List<SharedExpense> findByLedgerOrderByOccurredAtDesc(SharedLedger ledger);
}

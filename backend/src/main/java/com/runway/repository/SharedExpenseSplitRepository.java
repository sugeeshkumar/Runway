package com.runway.repository;

import com.runway.entity.SharedExpense;
import com.runway.entity.SharedExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharedExpenseSplitRepository extends JpaRepository<SharedExpenseSplit, UUID> {
    List<SharedExpenseSplit> findBySharedExpense(SharedExpense sharedExpense);
}

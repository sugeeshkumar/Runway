package com.runway.repository;

import com.runway.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByUserId(UUID userId);

    List<Budget> findByUserIdAndPeriodMonth(UUID userId, String periodMonth);

    Optional<Budget> findByUserIdAndCategoryIdAndPeriodMonth(UUID userId, UUID categoryId, String periodMonth);

    Optional<Budget> findByUserIdAndCategoryIsNullAndPeriodMonth(UUID userId, String periodMonth);
}

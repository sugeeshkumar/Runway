package com.runway.repository;

import com.runway.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByUserIdOrderByOccurredAtDesc(UUID userId);

    List<Expense> findByUserIdAndOccurredAtGreaterThanEqualOrderByOccurredAtDesc(UUID userId, Instant start);

    List<Expense> findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(UUID userId, Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.occurredAt >= :start AND e.occurredAt < :end")
    BigDecimal calculateOverallSpentForPeriod(@Param("userId") UUID userId,
                                               @Param("start") Instant start,
                                               @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.category.id = :categoryId AND e.occurredAt >= :start AND e.occurredAt < :end")
    BigDecimal calculateCategorySpentForPeriod(@Param("userId") UUID userId,
                                                @Param("categoryId") UUID categoryId,
                                                @Param("start") Instant start,
                                                @Param("end") Instant end);
}

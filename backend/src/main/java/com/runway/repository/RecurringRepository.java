package com.runway.repository;

import com.runway.entity.RecurringExpenseTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecurringRepository extends JpaRepository<RecurringExpenseTemplate, UUID> {
    List<RecurringExpenseTemplate> findByUserIdOrderByNextDueDateAsc(UUID userId);
}

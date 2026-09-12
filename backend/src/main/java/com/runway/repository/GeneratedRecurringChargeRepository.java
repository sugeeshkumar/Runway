package com.runway.repository;

import com.runway.entity.GeneratedRecurringCharge;
import com.runway.entity.RecurringExpenseTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface GeneratedRecurringChargeRepository extends JpaRepository<GeneratedRecurringCharge, UUID> {
    boolean existsByTemplateAndChargeDate(RecurringExpenseTemplate template, LocalDate chargeDate);
}

package com.runway.scheduler;

import com.runway.entity.*;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.GeneratedRecurringChargeRepository;
import com.runway.repository.RecurringRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
public class RecurringScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecurringScheduler.class);

    private final RecurringRepository recurringRepository;
    private final ExpenseRepository expenseRepository;
    private final GeneratedRecurringChargeRepository chargeRepository;

    public RecurringScheduler(RecurringRepository recurringRepository,
                               ExpenseRepository expenseRepository,
                               GeneratedRecurringChargeRepository chargeRepository) {
        this.recurringRepository = recurringRepository;
        this.expenseRepository = expenseRepository;
        this.chargeRepository = chargeRepository;
    }

    // Run daily at 00:05 AM
    @Scheduled(cron = "0 5 0 * * ?")
    @Transactional
    public int processDueRecurringExpenses() {
        LocalDate today = LocalDate.now();
        List<RecurringExpenseTemplate> dueTemplates = recurringRepository.findAll().stream()
                .filter(t -> !t.isPaused() && !t.getNextDueDate().isAfter(today))
                .toList();

        int generatedCount = 0;

        for (RecurringExpenseTemplate template : dueTemplates) {
            LocalDate chargeDate = template.getNextDueDate();

            // Idempotency check: Ensure charge for (template, chargeDate) has not already been generated
            boolean alreadyGenerated = chargeRepository.existsByTemplateAndChargeDate(template, chargeDate);
            if (!alreadyGenerated) {
                Expense expense = Expense.builder()
                        .user(template.getUser())
                        .amount(template.getAmount())
                        .currency(template.getCurrency())
                        .category(template.getCategory())
                        .description(template.getDescription())
                        .source(ExpenseSource.RECURRING)
                        .rawInput("Generated from template: " + template.getId())
                        .occurredAt(chargeDate.atStartOfDay(ZoneId.systemDefault()).toInstant())
                        .build();

                expense = expenseRepository.save(expense);

                GeneratedRecurringCharge charge = new GeneratedRecurringCharge(template, expense, chargeDate);
                chargeRepository.save(charge);
                generatedCount++;

                log.info("Generated recurring expense charge {} for template {} (User: {})",
                        expense.getId(), template.getId(), template.getUser().getEmail());
            }

            // Advance next_due_date to next period
            LocalDate nextDate = advanceDueDate(chargeDate, template.getCadence());
            template.setNextDueDate(nextDate);
            recurringRepository.save(template);
        }

        log.info("Processed {} recurring expense templates. Generated {} new charges.", dueTemplates.size(), generatedCount);
        return generatedCount;
    }

    private LocalDate advanceDueDate(LocalDate current, Cadence cadence) {
        if (cadence == null) return current.plusMonths(1);
        return switch (cadence) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusWeeks(1);
            case MONTHLY -> current.plusMonths(1);
            case YEARLY -> current.plusYears(1);
        };
    }
}

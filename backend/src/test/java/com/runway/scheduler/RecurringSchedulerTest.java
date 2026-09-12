package com.runway.scheduler;

import com.runway.entity.*;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.GeneratedRecurringChargeRepository;
import com.runway.repository.RecurringRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RecurringSchedulerTest {

    @Mock
    private RecurringRepository recurringRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private GeneratedRecurringChargeRepository chargeRepository;

    @InjectMocks
    private RecurringScheduler recurringScheduler;

    private User testUser;
    private Category testCategory;
    private RecurringExpenseTemplate rentTemplate;
    private RecurringExpenseTemplate pausedTemplate;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("sugeesh.murali@gmail.com");

        testCategory = new Category();
        testCategory.setId(UUID.randomUUID());
        testCategory.setName("Housing");

        rentTemplate = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("25000.00"))
                .currency("INR")
                .category(testCategory)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(LocalDate.now().minusDays(1)) // Due yesterday
                .description("Rent Payment")
                .isPaused(false)
                .build();

        pausedTemplate = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("649.00"))
                .currency("INR")
                .category(testCategory)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(LocalDate.now().minusDays(1)) // Due yesterday but paused
                .description("Netflix Subscription")
                .isPaused(true)
                .build();
    }

    @Test
    @DisplayName("Process due recurring expenses generates expense row and advances next due date")
    void testProcessDueExpenses_Success() {
        LocalDate initialDueDate = rentTemplate.getNextDueDate();
        when(recurringRepository.findAll()).thenReturn(List.of(rentTemplate, pausedTemplate));
        when(chargeRepository.existsByTemplateAndChargeDate(rentTemplate, initialDueDate)).thenReturn(false);
        when(expenseRepository.save(any(Expense.class))).thenAnswer(i -> {
            Expense e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        int count = recurringScheduler.processDueRecurringExpenses();

        assertEquals(1, count, "Only active due template should be processed");

        // Verify Expense created with RECURRING source
        ArgumentCaptor<Expense> expenseCaptor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expenseCaptor.capture());
        Expense savedExpense = expenseCaptor.getValue();
        assertEquals(new BigDecimal("25000.00"), savedExpense.getAmount());
        assertEquals(ExpenseSource.RECURRING, savedExpense.getSource());
        assertEquals("Rent Payment", savedExpense.getDescription());

        // Verify Next Due Date advanced by 1 month
        assertEquals(initialDueDate.plusMonths(1), rentTemplate.getNextDueDate());

        // Verify Idempotent Charge tracking record saved
        verify(chargeRepository).save(any(GeneratedRecurringCharge.class));
    }

    @Test
    @DisplayName("Idempotency check prevents duplicate charge generation for the same due date")
    void testProcessDueExpenses_Idempotency() {
        LocalDate initialDueDate = rentTemplate.getNextDueDate();
        when(recurringRepository.findAll()).thenReturn(List.of(rentTemplate));
        // Simulate already generated charge
        when(chargeRepository.existsByTemplateAndChargeDate(rentTemplate, initialDueDate)).thenReturn(true);

        int count = recurringScheduler.processDueRecurringExpenses();

        assertEquals(0, count, "Duplicate generation must be skipped");
        verify(expenseRepository, never()).save(any(Expense.class));

        // Next due date still advances even if charge was previously recorded
        assertEquals(initialDueDate.plusMonths(1), rentTemplate.getNextDueDate());
    }

    @Test
    @DisplayName("Verify cadence advancements for DAILY, WEEKLY, MONTHLY, and YEARLY")
    void testCadenceAdvancement() {
        LocalDate today = LocalDate.now();

        RecurringExpenseTemplate dailyTpl = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID()).user(testUser).amount(new BigDecimal("100.00"))
                .currency("INR").category(testCategory).cadence(Cadence.DAILY)
                .nextDueDate(today).description("Daily News").isPaused(false).build();

        RecurringExpenseTemplate weeklyTpl = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID()).user(testUser).amount(new BigDecimal("500.00"))
                .currency("INR").category(testCategory).cadence(Cadence.WEEKLY)
                .nextDueDate(today).description("Weekly Groceries").isPaused(false).build();

        RecurringExpenseTemplate yearlyTpl = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID()).user(testUser).amount(new BigDecimal("1200.00"))
                .currency("INR").category(testCategory).cadence(Cadence.YEARLY)
                .nextDueDate(today).description("Annual Domain").isPaused(false).build();

        when(recurringRepository.findAll()).thenReturn(List.of(dailyTpl, weeklyTpl, yearlyTpl));
        when(chargeRepository.existsByTemplateAndChargeDate(any(), any())).thenReturn(false);
        when(expenseRepository.save(any(Expense.class))).thenAnswer(i -> {
            Expense e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        int count = recurringScheduler.processDueRecurringExpenses();
        assertEquals(3, count);

        assertEquals(today.plusDays(1), dailyTpl.getNextDueDate());
        assertEquals(today.plusWeeks(1), weeklyTpl.getNextDueDate());
        assertEquals(today.plusYears(1), yearlyTpl.getNextDueDate());
    }
}

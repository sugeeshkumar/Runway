package com.runway.service;

import com.runway.dto.AnalyticsInsightsDto;
import com.runway.entity.Category;
import com.runway.entity.Expense;
import com.runway.entity.User;
import com.runway.repository.BudgetRepository;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AnalyticsServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User testUser;
    private Category diningCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("analytics@runway.app")
                .defaultCurrency("INR")
                .build();

        diningCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Dining")
                .color("#F97316")
                .build();
    }

    @Test
    void getAnalyticsInsights_WithExpenses_ComputesOverviewAndDeltas() {
        Instant now = Instant.now();
        Expense e1 = Expense.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("1500.00"))
                .merchant("Zaitoon")
                .category(diningCategory)
                .occurredAt(now.minus(1, ChronoUnit.DAYS))
                .build();

        Expense e2 = Expense.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("500.00"))
                .merchant("Starbucks")
                .category(diningCategory)
                .occurredAt(now.minus(2, ChronoUnit.DAYS))
                .build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2));

        AnalyticsInsightsDto dto = analyticsService.getAnalyticsInsights(testUser.getId(), "THIS_MONTH", "DAILY");

        assertNotNull(dto);
        assertNotNull(dto.getOverview());
        assertEquals(0, new BigDecimal("2000.00").compareTo(dto.getOverview().getTotalSpent()));
        assertEquals(2, dto.getOverview().getTotalTransactions());
        assertEquals(new BigDecimal("1500.00"), dto.getOverview().getLargestExpenseAmount());
        assertEquals("Zaitoon", dto.getOverview().getLargestExpenseMerchant());
    }

    @Test
    void getAnalyticsInsights_NoExpenses_ReturnsZeroOverview() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        AnalyticsInsightsDto dto = analyticsService.getAnalyticsInsights(testUser.getId(), "THIS_MONTH", "DAILY");

        assertNotNull(dto);
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.getOverview().getTotalSpent()));
        assertEquals(0, dto.getOverview().getTotalTransactions());
        assertNull(dto.getOverview().getLargestExpenseMerchant());
    }
}

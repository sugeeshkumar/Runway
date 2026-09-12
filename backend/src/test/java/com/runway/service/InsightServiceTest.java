package com.runway.service;

import com.runway.dto.InsightDto;
import com.runway.dto.InsightResponseDto;
import com.runway.dto.InsightSeverity;
import com.runway.dto.InsightType;
import com.runway.entity.Budget;
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
import java.time.LocalDate;
import java.time.ZoneId;
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
public class InsightServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InsightService insightService;

    private User testUser;
    private Category diningCategory;
    private Category transportCategory;
    private Category rentCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("insights@runway.app")
                .defaultCurrency("INR")
                .build();

        diningCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Dining")
                .color("#F97316")
                .build();

        transportCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Transport")
                .color("#3B82F6")
                .build();

        rentCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Rent")
                .color("#10B981")
                .build();
    }

    @Test
    void generateInsights_InsufficientData_ReturnsNotice() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertNotNull(response);
        assertFalse(response.isHasEnoughData());
        assertTrue(response.getInsights().isEmpty());
        assertEquals("Keep tracking expenses to unlock spending insights.", response.getNotice());
    }

    @Test
    void generateInsights_CategoryIncrease_GeneratesIncreaseInsight() {
        Instant now = Instant.now();
        // Current period: 3 dining expenses totaling 3500
        Expense e1 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("1000")).occurredAt(now).build();
        Expense e2 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("1500")).occurredAt(now).build();
        Expense e3 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("1000")).occurredAt(now).build();

        // Previous period: 1 dining expense of 2000 (+75% increase)
        Expense prevE = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("2000")).occurredAt(now.minus(30, ChronoUnit.DAYS)).build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2, e3))
                .thenReturn(List.of(prevE));

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertTrue(response.isHasEnoughData());
        assertFalse(response.getInsights().isEmpty());

        InsightDto increaseInsight = response.getInsights().stream()
                .filter(i -> i.getType() == InsightType.CATEGORY_INCREASE)
                .findFirst()
                .orElse(null);

        assertNotNull(increaseInsight);
        assertEquals("DINING", increaseInsight.getCategory());
        assertTrue(increaseInsight.getDescription().contains("last month"));
    }

    @Test
    void generateInsights_CategoryDecrease_GeneratesDecreaseInsight() {
        Instant now = Instant.now();
        // Current: 3 transport expenses totaling 600
        Expense e1 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(transportCategory).amount(new BigDecimal("200")).occurredAt(now).build();
        Expense e2 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(transportCategory).amount(new BigDecimal("200")).occurredAt(now).build();
        Expense e3 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(transportCategory).amount(new BigDecimal("200")).occurredAt(now).build();

        // Previous: Transport was 1500 (-60% drop)
        Expense prevE = Expense.builder().id(UUID.randomUUID()).user(testUser).category(transportCategory).amount(new BigDecimal("1500")).occurredAt(now.minus(30, ChronoUnit.DAYS)).build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2, e3))
                .thenReturn(List.of(prevE));

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertTrue(response.isHasEnoughData());
        InsightDto decreaseInsight = response.getInsights().stream()
                .filter(i -> i.getType() == InsightType.CATEGORY_DECREASE)
                .findFirst()
                .orElse(null);

        assertNotNull(decreaseInsight);
        assertEquals("TRANSPORT", decreaseInsight.getCategory());
        assertEquals(InsightSeverity.POSITIVE, decreaseInsight.getSeverity());
    }

    @Test
    void generateInsights_MerchantFrequency_DetectsFrequentMerchant() {
        Instant now = Instant.now();
        Expense e1 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Swiggy").amount(new BigDecimal("300")).occurredAt(now).build();
        Expense e2 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Swiggy").amount(new BigDecimal("450")).occurredAt(now).build();
        Expense e3 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Swiggy").amount(new BigDecimal("500")).occurredAt(now).build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2, e3))
                .thenReturn(Collections.emptyList());

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertTrue(response.isHasEnoughData());
        InsightDto merchantInsight = response.getInsights().stream()
                .filter(i -> i.getType() == InsightType.MERCHANT_FREQUENCY)
                .findFirst()
                .orElse(null);

        assertNotNull(merchantInsight);
        assertTrue(merchantInsight.getTitle().contains("Swiggy"));
        assertTrue(merchantInsight.getDescription().contains("3 transactions"));
    }

    @Test
    void generateInsights_StatisticalAnomaly_DetectsUnusualExpense() {
        Instant now = Instant.now();
        // Regular dining expenses around 250-350, plus one 3500 luxury dinner
        Expense e1 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Cafe").amount(new BigDecimal("250")).occurredAt(now).build();
        Expense e2 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Bistro").amount(new BigDecimal("300")).occurredAt(now).build();
        Expense e3 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Diner").amount(new BigDecimal("350")).occurredAt(now).build();
        Expense outlier = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).merchant("Zaitoon").amount(new BigDecimal("3500")).occurredAt(now).build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2, e3, outlier))
                .thenReturn(Collections.emptyList());

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertTrue(response.isHasEnoughData());
        InsightDto anomalyInsight = response.getInsights().stream()
                .filter(i -> i.getType() == InsightType.ANOMALY_UNUSUAL_EXPENSE)
                .findFirst()
                .orElse(null);

        assertNotNull(anomalyInsight);
        assertEquals("UNUSUAL SPENDING", anomalyInsight.getCategory());
        assertTrue(anomalyInsight.getDescription().contains("significantly above"));
    }

    @Test
    void generateInsights_BudgetPacingOverage_GeneratesBudgetWarning() {
        Instant now = Instant.now();
        // 3 expenses totaling 18000
        Expense e1 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("6000")).occurredAt(now).build();
        Expense e2 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("6000")).occurredAt(now).build();
        Expense e3 = Expense.builder().id(UUID.randomUUID()).user(testUser).category(diningCategory).amount(new BigDecimal("6000")).occurredAt(now).build();

        // Overall budget is only 15000 -> Projected to blow way past 15000
        Budget budget = Budget.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("15000.00"))
                .periodMonth(java.time.YearMonth.now().toString())
                .build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(e1, e2, e3))
                .thenReturn(Collections.emptyList());
        when(budgetRepository.findByUserIdAndPeriodMonth(eq(testUser.getId()), any(String.class)))
                .thenReturn(List.of(budget));

        InsightResponseDto response = insightService.generateInsights(testUser.getId(), "THIS_MONTH");

        assertTrue(response.isHasEnoughData());
        InsightDto pacingInsight = response.getInsights().stream()
                .filter(i -> i.getType() == InsightType.BUDGET_PACING)
                .findFirst()
                .orElse(null);

        assertNotNull(pacingInsight);
        assertEquals(InsightSeverity.WARNING, pacingInsight.getSeverity());
        assertTrue(pacingInsight.getDescription().contains("exceed"));
    }
}

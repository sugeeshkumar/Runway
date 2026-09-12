package com.runway.service;

import com.runway.dto.BudgetDto;
import com.runway.dto.BudgetStatus;
import com.runway.dto.CreateBudgetRequest;
import com.runway.entity.Budget;
import com.runway.entity.Category;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private BudgetService budgetService;

    private User testUser;
    private User otherUser;
    private Category userCategory;
    private Category otherCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("user1@runway.app")
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .email("user2@runway.app")
                .build();

        userCategory = Category.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Food & Dining")
                .build();

        otherCategory = Category.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .name("Other User Category")
                .build();
    }

    @Test
    void createBudget_UnderOtherUserCategory_ThrowsIllegalStateException() {
        CreateBudgetRequest request = new CreateBudgetRequest();
        request.setCategoryId(otherCategory.getId());
        request.setPeriodMonth("2026-09");
        request.setAmount(new BigDecimal("1000.00"));

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findById(otherCategory.getId())).thenReturn(Optional.of(otherCategory));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                budgetService.createOrUpdateBudget(testUser.getId(), request)
        );

        assertEquals("Unauthorized category access", ex.getMessage());
    }

    @Test
    void getBudgetsForUser_SafeStatus() {
        Budget budget = Budget.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .category(userCategory)
                .periodMonth("2026-09")
                .amount(new BigDecimal("1000.00"))
                .build();

        when(budgetRepository.findByUserIdAndPeriodMonth(testUser.getId(), "2026-09"))
                .thenReturn(List.of(budget));
        when(expenseRepository.calculateCategorySpentForPeriod(eq(testUser.getId()), eq(userCategory.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("400.00")); // 40% spent -> SAFE

        List<BudgetDto> results = budgetService.getBudgetsForUserAndMonth(testUser.getId(), "2026-09");

        assertEquals(1, results.size());
        BudgetDto dto = results.get(0);
        assertEquals(BudgetStatus.SAFE, dto.getStatus());
        assertEquals(new BigDecimal("600.00"), dto.getRemainingAmount());
    }

    @Test
    void getBudgetsForUser_ApproachingStatus() {
        Budget budget = Budget.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .periodMonth("2026-09")
                .amount(new BigDecimal("1000.00"))
                .build();

        when(budgetRepository.findByUserIdAndPeriodMonth(testUser.getId(), "2026-09"))
                .thenReturn(List.of(budget));
        when(expenseRepository.calculateOverallSpentForPeriod(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("800.00")); // 80% spent -> APPROACHING

        List<BudgetDto> results = budgetService.getBudgetsForUserAndMonth(testUser.getId(), "2026-09");

        assertEquals(BudgetStatus.APPROACHING, results.get(0).getStatus());
    }

    @Test
    void getBudgetsForUser_OverBudgetStatus() {
        Budget budget = Budget.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .periodMonth("2026-09")
                .amount(new BigDecimal("1000.00"))
                .build();

        when(budgetRepository.findByUserIdAndPeriodMonth(testUser.getId(), "2026-09"))
                .thenReturn(List.of(budget));
        when(expenseRepository.calculateOverallSpentForPeriod(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(new BigDecimal("1200.00")); // 120% spent -> OVER

        List<BudgetDto> results = budgetService.getBudgetsForUserAndMonth(testUser.getId(), "2026-09");

        assertEquals(BudgetStatus.OVER, results.get(0).getStatus());
    }
}

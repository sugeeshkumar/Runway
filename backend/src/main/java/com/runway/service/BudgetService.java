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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public BudgetService(BudgetRepository budgetRepository, ExpenseRepository expenseRepository, UserRepository userRepository, CategoryRepository categoryRepository, CategoryService categoryService) {
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<BudgetDto> getBudgetsForUserAndMonth(UUID userId, String periodMonth) {
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonth(userId, periodMonth);
        return budgets.stream()
                .map(b -> computeBudgetDto(b, userId))
                .toList();
    }

    @Transactional
    public BudgetDto createOrUpdateBudget(UUID userId, CreateBudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
                throw new IllegalStateException("Unauthorized category access");
            }
        }

        Budget budget;
        if (category == null) {
            budget = budgetRepository.findByUserIdAndCategoryIsNullAndPeriodMonth(userId, request.getPeriodMonth())
                    .orElse(Budget.builder().user(user).periodMonth(request.getPeriodMonth()).build());
        } else {
            budget = budgetRepository.findByUserIdAndCategoryIdAndPeriodMonth(userId, request.getCategoryId(), request.getPeriodMonth())
                    .orElse(Budget.builder().user(user).category(category).periodMonth(request.getPeriodMonth()).build());
        }

        budget.setAmount(request.getAmount());
        budget = budgetRepository.save(budget);

        return computeBudgetDto(budget, userId);
    }

    @Transactional
    public void deleteBudget(UUID userId, UUID budgetId) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found"));

        if (!budget.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this budget");
        }

        budgetRepository.delete(budget);
    }

    private BudgetDto computeBudgetDto(Budget budget, UUID userId) {
        YearMonth ym = YearMonth.parse(budget.getPeriodMonth());
        Instant start = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = ym.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        BigDecimal spentAmount;
        if (budget.getCategory() == null) {
            spentAmount = expenseRepository.calculateOverallSpentForPeriod(userId, start, end);
        } else {
            spentAmount = expenseRepository.calculateCategorySpentForPeriod(userId, budget.getCategory().getId(), start, end);
        }

        BigDecimal remainingAmount = budget.getAmount().subtract(spentAmount);

        BudgetStatus status;
        if (budget.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            status = BudgetStatus.SAFE;
        } else {
            BigDecimal ratio = spentAmount.divide(budget.getAmount(), 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("1.00")) > 0) {
                status = BudgetStatus.OVER;
            } else if (ratio.compareTo(new BigDecimal("0.75")) > 0) {
                status = BudgetStatus.APPROACHING;
            } else {
                status = BudgetStatus.SAFE;
            }
        }

        return BudgetDto.builder()
                .id(budget.getId())
                .userId(userId)
                .category(budget.getCategory() != null ? categoryService.mapToDto(budget.getCategory()) : null)
                .periodMonth(budget.getPeriodMonth())
                .amount(budget.getAmount())
                .spentAmount(spentAmount)
                .remainingAmount(remainingAmount)
                .status(status)
                .build();
    }
}

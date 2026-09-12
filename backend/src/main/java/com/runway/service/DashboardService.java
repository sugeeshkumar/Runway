package com.runway.service;

import com.runway.dto.*;
import com.runway.entity.Budget;
import com.runway.entity.Expense;
import com.runway.entity.User;
import com.runway.repository.BudgetRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringService recurringService;

    public DashboardService(UserRepository userRepository, ExpenseRepository expenseRepository, BudgetRepository budgetRepository, RecurringService recurringService) {
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.recurringService = recurringService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary(UUID userId, String periodMonthStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String userDefaultCurrency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";
        YearMonth currentYm = (periodMonthStr != null && !periodMonthStr.isBlank())
                ? YearMonth.parse(periodMonthStr)
                : YearMonth.now();

        YearMonth prevYm = currentYm.minusMonths(1);

        Instant currentStart = currentYm.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant currentEnd = currentYm.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        Instant prevStart = prevYm.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant prevEnd = prevYm.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Expense> allUserExpenses = expenseRepository.findByUserIdOrderByOccurredAtDesc(userId);

        List<Expense> currentMonthExpenses = allUserExpenses.stream()
                .filter(e -> !e.getOccurredAt().isBefore(currentStart) && e.getOccurredAt().isBefore(currentEnd))
                .toList();

        List<Expense> prevMonthExpenses = allUserExpenses.stream()
                .filter(e -> !e.getOccurredAt().isBefore(prevStart) && e.getOccurredAt().isBefore(prevEnd))
                .toList();

        BigDecimal totalSpent = currentMonthExpenses.stream()
                .map(e -> convertAmount(e.getAmount(), e.getCurrency(), userDefaultCurrency))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal prevSpent = prevMonthExpenses.stream()
                .map(e -> convertAmount(e.getAmount(), e.getCurrency(), userDefaultCurrency))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal momDelta = BigDecimal.ZERO;
        if (prevSpent.compareTo(BigDecimal.ZERO) > 0) {
            momDelta = totalSpent.subtract(prevSpent)
                    .divide(prevSpent, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        // Overall Budget
        Optional<Budget> overallBudgetOpt = budgetRepository.findByUserIdAndCategoryIsNullAndPeriodMonth(userId, currentYm.toString());
        BigDecimal overallBudgetAmount = overallBudgetOpt.map(Budget::getAmount).orElse(new BigDecimal("2000"));

        BigDecimal remainingBudget = overallBudgetAmount.subtract(totalSpent);

        BudgetStatus status;
        if (overallBudgetAmount.compareTo(BigDecimal.ZERO) == 0) {
            status = BudgetStatus.SAFE;
        } else {
            BigDecimal ratio = totalSpent.divide(overallBudgetAmount, 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(new BigDecimal("1.00")) > 0) {
                status = BudgetStatus.OVER;
            } else if (ratio.compareTo(new BigDecimal("0.75")) > 0) {
                status = BudgetStatus.APPROACHING;
            } else {
                status = BudgetStatus.SAFE;
            }
        }

        // Top Categories
        Map<UUID, CategorySummaryDto> categoryMap = new HashMap<>();
        for (Expense e : currentMonthExpenses) {
            UUID catId = e.getCategory().getId();
            BigDecimal convAmount = convertAmount(e.getAmount(), e.getCurrency(), userDefaultCurrency);

            categoryMap.compute(catId, (k, existing) -> {
                if (existing == null) {
                    return CategorySummaryDto.builder()
                            .categoryId(catId)
                            .categoryName(e.getCategory().getName())
                            .color(e.getCategory().getColor())
                            .spentAmount(convAmount)
                            .build();
                } else {
                    existing.setSpentAmount(existing.getSpentAmount().add(convAmount));
                    return existing;
                }
            });
        }

        List<CategorySummaryDto> topCategories = categoryMap.values().stream()
                .sorted(Comparator.comparing(CategorySummaryDto::getSpentAmount).reversed())
                .limit(3)
                .peek(c -> {
                    if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
                        double pct = c.getSpentAmount()
                                .divide(totalSpent, 4, RoundingMode.HALF_UP)
                                .doubleValue() * 100.0;
                        c.setPercentage(Math.round(pct * 10.0) / 10.0);
                    }
                })
                .collect(Collectors.toList());

        List<RecurringTemplateDto> upcomingRecurring = recurringService.getRecurringTemplatesForUser(userId);

        return DashboardSummaryDto.builder()
                .periodMonth(currentYm.toString())
                .userDefaultCurrency(userDefaultCurrency)
                .overallBudget(overallBudgetAmount)
                .totalSpent(totalSpent)
                .remainingBudget(remainingBudget)
                .budgetStatus(status)
                .previousMonthSpent(prevSpent)
                .monthOverMonthDeltaPercentage(momDelta)
                .topCategories(topCategories)
                .upcomingRecurring(upcomingRecurring)
                .build();
    }

    public static BigDecimal convertAmount(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        // Rates relative to USD (1 USD = X target)
        Map<String, BigDecimal> usdRates = Map.of(
                "USD", new BigDecimal("1.0"),
                "INR", new BigDecimal("83.5"),
                "EUR", new BigDecimal("0.92"),
                "GBP", new BigDecimal("0.78")
        );

        BigDecimal fromRateInUsd = usdRates.getOrDefault(fromCurrency.toUpperCase(), new BigDecimal("1.0"));
        BigDecimal toRateInUsd = usdRates.getOrDefault(toCurrency.toUpperCase(), new BigDecimal("1.0"));

        // Convert to USD first, then to target
        BigDecimal amountInUsd = amount.divide(fromRateInUsd, 6, RoundingMode.HALF_UP);
        return amountInUsd.multiply(toRateInUsd).setScale(2, RoundingMode.HALF_UP);
    }
}

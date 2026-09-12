package com.runway.service;

import com.runway.dto.*;
import com.runway.entity.Budget;
import com.runway.entity.Category;
import com.runway.entity.Expense;
import com.runway.entity.User;
import com.runway.repository.BudgetRepository;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InsightService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    public InsightService(ExpenseRepository expenseRepository,
                          CategoryRepository categoryRepository,
                          BudgetRepository budgetRepository,
                          UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public InsightResponseDto generateInsights(UUID userId, String periodStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String currency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";

        String period = (periodStr != null && !periodStr.isBlank()) ? periodStr.toUpperCase() : "THIS_MONTH";
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zoneId);

        Instant startInstant;
        Instant endInstant;
        Instant prevStartInstant;
        Instant prevEndInstant;
        YearMonth currentYm = YearMonth.now(zoneId);

        switch (period) {
            case "LAST_MONTH": {
                YearMonth ym = currentYm.minusMonths(1);
                startInstant = ym.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = ym.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevYm = ym.minusMonths(1);
                prevStartInstant = prevYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                break;
            }
            case "LAST_3_MONTHS": {
                YearMonth startYm = currentYm.minusMonths(2);
                startInstant = startYm.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = currentYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevEndYm = startYm.minusMonths(1);
                YearMonth prevStartYm = prevEndYm.minusMonths(2);
                prevStartInstant = prevStartYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevEndYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                break;
            }
            case "THIS_YEAR": {
                int year = today.getYear();
                startInstant = LocalDate.of(year, 1, 1).atStartOfDay(zoneId).toInstant();
                endInstant = LocalDate.of(year, 12, 31).atTime(23, 59, 59).atZone(zoneId).toInstant();

                prevStartInstant = LocalDate.of(year - 1, 1, 1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = LocalDate.of(year - 1, 12, 31).atTime(23, 59, 59).atZone(zoneId).toInstant();
                break;
            }
            case "THIS_MONTH":
            default: {
                startInstant = currentYm.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = currentYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevYm = currentYm.minusMonths(1);
                prevStartInstant = prevYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                break;
            }
        }

        List<Expense> currentExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, startInstant, endInstant);

        // Insufficient Data Check
        if (currentExpenses == null || currentExpenses.size() < 3) {
            return InsightResponseDto.builder()
                    .insights(Collections.emptyList())
                    .hasEnoughData(false)
                    .currency(currency)
                    .period(period)
                    .notice("Keep tracking expenses to unlock spending insights.")
                    .build();
        }

        List<Expense> prevExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, prevStartInstant, prevEndInstant);
        List<Budget> budgets = budgetRepository.findByUserIdAndPeriodMonth(userId, currentYm.toString());

        List<InsightDto> candidates = new ArrayList<>();

        // 1. Budget Pacing Insight
        computeBudgetPacingInsight(candidates, budgets, currentExpenses, today, currentYm, currency, period);

        // 2. Category Behavior & MoM Changes
        computeCategoryInsights(candidates, currentExpenses, prevExpenses, currency, period);

        // 3. Merchant Habits & Repeated Spending
        computeMerchantInsights(candidates, currentExpenses, currency, period);

        // 4. Spending Patterns (Weekday vs Weekend)
        computeSpendingPatternInsights(candidates, currentExpenses, zoneId, currency, period);

        // 5. Statistical Anomaly Detection (Unusual Transactions)
        computeAnomalyInsights(candidates, currentExpenses, currency, period);

        // 6. Ranking & Deduplication (Top 3-5 insights)
        List<InsightDto> topInsights = rankAndDeduplicateInsights(candidates);

        return InsightResponseDto.builder()
                .insights(topInsights)
                .hasEnoughData(true)
                .currency(currency)
                .period(period)
                .notice(null)
                .build();
    }

    private void computeBudgetPacingInsight(List<InsightDto> candidates,
                                           List<Budget> budgets,
                                           List<Expense> currentExpenses,
                                           LocalDate today,
                                           YearMonth currentYm,
                                           String currency,
                                           String period) {
        if (budgets == null || budgets.isEmpty() || !"THIS_MONTH".equalsIgnoreCase(period)) {
            return;
        }

        Budget overallBudget = budgets.stream()
                .filter(b -> b.getCategory() == null)
                .findFirst()
                .orElse(null);

        if (overallBudget != null && overallBudget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal budgetLimit = overallBudget.getAmount();
            BigDecimal totalSpent = currentExpenses.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int dayOfMonth = today.getDayOfMonth();
            int daysInMonth = currentYm.lengthOfMonth();

            if (dayOfMonth >= 3) {
                BigDecimal dailyRunRate = totalSpent.divide(BigDecimal.valueOf(dayOfMonth), 4, RoundingMode.HALF_UP);
                BigDecimal projectedTotal = dailyRunRate.multiply(BigDecimal.valueOf(daysInMonth)).setScale(2, RoundingMode.HALF_UP);

                if (projectedTotal.compareTo(budgetLimit) > 0) {
                    BigDecimal overage = projectedTotal.subtract(budgetLimit);
                    candidates.add(InsightDto.builder()
                            .id("budget-pacing-overage")
                            .type(InsightType.BUDGET_PACING)
                            .severity(InsightSeverity.WARNING)
                            .category("PACING & BUDGET")
                            .title("Pacing above monthly budget")
                            .description(String.format("At your current pace, you're projected to exceed your %s %s budget by approximately %s %s.",
                                    currency, formatNumber(budgetLimit), currency, formatNumber(overage)))
                            .metric("+" + formatNumber(overage))
                            .value(overage.doubleValue())
                            .period(period)
                            .impactScore(95.0)
                            .build());
                } else if (dayOfMonth >= 10 && projectedTotal.compareTo(budgetLimit.multiply(new BigDecimal("0.85"))) < 0) {
                    BigDecimal savings = budgetLimit.subtract(projectedTotal);
                    candidates.add(InsightDto.builder()
                            .id("budget-pacing-under")
                            .type(InsightType.BUDGET_PACING)
                            .severity(InsightSeverity.POSITIVE)
                            .category("PACING & BUDGET")
                            .title("Comfortably on track")
                            .description(String.format("Your spending velocity is disciplined. You are projected to stay %s %s under your monthly budget.",
                                    currency, formatNumber(savings)))
                            .metric("-" + formatNumber(savings))
                            .value(savings.doubleValue())
                            .period(period)
                            .impactScore(78.0)
                            .build());
                }
            }
        }
    }

    private void computeCategoryInsights(List<InsightDto> candidates,
                                         List<Expense> currentExpenses,
                                         List<Expense> prevExpenses,
                                         String currency,
                                         String period) {
        BigDecimal totalCurrent = currentExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCurrent.compareTo(BigDecimal.ZERO) <= 0) return;

        Map<String, BigDecimal> currentByCat = new HashMap<>();
        for (Expense e : currentExpenses) {
            String catName = e.getCategory() != null ? e.getCategory().getName() : "Uncategorized";
            currentByCat.put(catName, currentByCat.getOrDefault(catName, BigDecimal.ZERO).add(e.getAmount()));
        }

        Map<String, BigDecimal> prevByCat = new HashMap<>();
        if (prevExpenses != null) {
            for (Expense e : prevExpenses) {
                String catName = e.getCategory() != null ? e.getCategory().getName() : "Uncategorized";
                prevByCat.put(catName, prevByCat.getOrDefault(catName, BigDecimal.ZERO).add(e.getAmount()));
            }
        }

        // Top Category
        Map.Entry<String, BigDecimal> topEntry = currentByCat.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (topEntry != null) {
            double topShare = topEntry.getValue().divide(totalCurrent, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            if (topShare >= 25.0) {
                candidates.add(InsightDto.builder()
                        .id("top-cat-" + sanitizeId(topEntry.getKey()))
                        .type(InsightType.TOP_CATEGORY)
                        .severity(InsightSeverity.NEUTRAL)
                        .category(topEntry.getKey().toUpperCase())
                        .title(String.format("%s is your largest expenditure", topEntry.getKey()))
                        .description(String.format("You spent %s %s on %s, accounting for %.0f%% of your total expenses.",
                                currency, formatNumber(topEntry.getValue()), topEntry.getKey(), topShare))
                        .metric(String.format("%.0f%% share", topShare))
                        .value(topShare)
                        .period(period)
                        .impactScore(70.0 + (topShare * 0.2))
                        .build());
            }
        }

        // MoM Category Increases & Decreases
        for (Map.Entry<String, BigDecimal> entry : currentByCat.entrySet()) {
            String cat = entry.getKey();
            BigDecimal currAmount = entry.getValue();
            BigDecimal prevAmount = prevByCat.getOrDefault(cat, BigDecimal.ZERO);

            if (prevAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal diff = currAmount.subtract(prevAmount);
                double pctChange = diff.divide(prevAmount, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;

                if (pctChange >= 20.0 && diff.compareTo(new BigDecimal("100.00")) >= 0) {
                    candidates.add(InsightDto.builder()
                            .id("cat-inc-" + sanitizeId(cat))
                            .type(InsightType.CATEGORY_INCREASE)
                            .severity(InsightSeverity.INFO)
                            .category(cat.toUpperCase())
                            .title(String.format("%s spending increased %.0f%%", cat, pctChange))
                            .description(String.format("You spent %s %s this month compared with %s %s last month (+%s %s).",
                                    currency, formatNumber(currAmount), currency, formatNumber(prevAmount), currency, formatNumber(diff)))
                            .metric(String.format("+%.0f%%", pctChange))
                            .value(pctChange)
                            .period(period)
                            .impactScore(82.0 + Math.min(10.0, pctChange * 0.1))
                            .build());
                } else if (pctChange <= -20.0 && diff.abs().compareTo(new BigDecimal("100.00")) >= 0) {
                    candidates.add(InsightDto.builder()
                            .id("cat-dec-" + sanitizeId(cat))
                            .type(InsightType.CATEGORY_DECREASE)
                            .severity(InsightSeverity.POSITIVE)
                            .category(cat.toUpperCase())
                            .title(String.format("%s spending dropped %.0f%%", cat, Math.abs(pctChange)))
                            .description(String.format("You reduced %s spending to %s %s from %s %s in the previous period.",
                                    cat, currency, formatNumber(currAmount), currency, formatNumber(prevAmount)))
                            .metric(String.format("-%.0f%%", Math.abs(pctChange)))
                            .value(pctChange)
                            .period(period)
                            .impactScore(68.0 + Math.min(10.0, Math.abs(pctChange) * 0.1))
                            .build());
                }
            }
        }
    }

    private void computeMerchantInsights(List<InsightDto> candidates,
                                         List<Expense> currentExpenses,
                                         String currency,
                                         String period) {
        Map<String, List<Expense>> byMerchant = currentExpenses.stream()
                .filter(e -> e.getMerchant() != null && !e.getMerchant().trim().isEmpty())
                .collect(Collectors.groupingBy(e -> e.getMerchant().trim()));

        if (byMerchant.isEmpty()) return;

        // Frequent merchant
        Map.Entry<String, List<Expense>> mostFrequent = byMerchant.entrySet().stream()
                .max(Comparator.comparingInt(e -> e.getValue().size()))
                .orElse(null);

        if (mostFrequent != null && mostFrequent.getValue().size() >= 3) {
            String merchant = mostFrequent.getKey();
            int count = mostFrequent.getValue().size();
            BigDecimal totalSpent = mostFrequent.getValue().stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            candidates.add(InsightDto.builder()
                    .id("merchant-freq-" + sanitizeId(merchant))
                    .type(InsightType.MERCHANT_FREQUENCY)
                    .severity(InsightSeverity.INFO)
                    .category("MERCHANT BEHAVIOR")
                    .title(String.format("%s is your most frequent merchant", merchant))
                    .description(String.format("You logged %d transactions at %s totaling %s %s this period.",
                            count, merchant, currency, formatNumber(totalSpent)))
                    .metric(String.format("%d visits", count))
                    .value((double) count)
                    .period(period)
                    .impactScore(76.0 + Math.min(10.0, count * 2.0))
                    .build());
        }
    }

    private void computeSpendingPatternInsights(List<InsightDto> candidates,
                                                List<Expense> currentExpenses,
                                                ZoneId zoneId,
                                                String currency,
                                                String period) {
        if (currentExpenses.size() < 5) return;

        Map<DayOfWeek, BigDecimal> spendByDay = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek d : DayOfWeek.values()) spendByDay.put(d, BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        for (Expense e : currentExpenses) {
            DayOfWeek dow = e.getOccurredAt().atZone(zoneId).getDayOfWeek();
            spendByDay.put(dow, spendByDay.get(dow).add(e.getAmount()));
            total = total.add(e.getAmount());
        }

        if (total.compareTo(BigDecimal.ZERO) <= 0) return;

        // Peak Day
        Map.Entry<DayOfWeek, BigDecimal> peakDay = spendByDay.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);

        if (peakDay != null && peakDay.getValue().compareTo(BigDecimal.ZERO) > 0) {
            double share = peakDay.getValue().divide(total, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
            if (share >= 28.0) {
                String dayName = peakDay.getKey().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                candidates.add(InsightDto.builder()
                        .id("peak-day-" + peakDay.getKey().name())
                        .type(InsightType.SPENDING_PATTERN_WEEKDAY)
                        .severity(InsightSeverity.NEUTRAL)
                        .category("SPENDING PATTERN")
                        .title(String.format("%ss are your highest-spending day", dayName))
                        .description(String.format("%ss account for %.0f%% of your total expenses (%s %s).",
                                dayName, share, currency, formatNumber(peakDay.getValue())))
                        .metric(String.format("%.0f%% on %ss", share, dayName))
                        .value(share)
                        .period(period)
                        .impactScore(65.0)
                        .build());
            }
        }

        // Weekend vs Weekday Ratio
        BigDecimal weekendSpend = spendByDay.get(DayOfWeek.SATURDAY).add(spendByDay.get(DayOfWeek.SUNDAY));
        BigDecimal weekdaySpend = total.subtract(weekendSpend);

        if (weekdaySpend.compareTo(BigDecimal.ZERO) > 0 && weekendSpend.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal weekendDaily = weekendSpend.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal weekdayDaily = weekdaySpend.divide(BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP);

            if (weekdayDaily.compareTo(BigDecimal.ZERO) > 0) {
                double ratio = weekendDaily.divide(weekdayDaily, 2, RoundingMode.HALF_UP).doubleValue();
                if (ratio >= 1.8) {
                    candidates.add(InsightDto.builder()
                            .id("weekend-velocity-high")
                            .type(InsightType.SPENDING_PATTERN_WEEKEND)
                            .severity(InsightSeverity.INFO)
                            .category("SPENDING PATTERN")
                            .title(String.format("Weekend spending is %.1f× higher than weekdays", ratio))
                            .description(String.format("You average %s %s/day on weekends compared with %s %s/day on weekdays.",
                                    currency, formatNumber(weekendDaily), currency, formatNumber(weekdayDaily)))
                            .metric(String.format("%.1f× pace", ratio))
                            .value(ratio)
                            .period(period)
                            .impactScore(64.0)
                            .build());
                }
            }
        }
    }

    private void computeAnomalyInsights(List<InsightDto> candidates,
                                        List<Expense> currentExpenses,
                                        String currency,
                                        String period) {
        if (currentExpenses.size() < 4) return;

        // Group by category to find category mean
        Map<String, List<BigDecimal>> amountsByCat = new HashMap<>();
        for (Expense e : currentExpenses) {
            String cat = e.getCategory() != null ? e.getCategory().getName() : "General";
            amountsByCat.computeIfAbsent(cat, k -> new ArrayList<>()).add(e.getAmount());
        }

        Expense mostUnusualExpense = null;
        BigDecimal highestMultiplier = BigDecimal.ZERO;
        String unusualCat = null;
        BigDecimal unusualCatAvg = BigDecimal.ZERO;

        for (Expense e : currentExpenses) {
            String cat = e.getCategory() != null ? e.getCategory().getName() : "General";
            List<BigDecimal> amounts = amountsByCat.get(cat);
            if (amounts != null && amounts.size() >= 2) {
                BigDecimal sum = amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal avg = sum.divide(BigDecimal.valueOf(amounts.size()), 2, RoundingMode.HALF_UP);

                if (avg.compareTo(new BigDecimal("50.00")) > 0 && e.getAmount().compareTo(new BigDecimal("200.00")) > 0) {
                    BigDecimal multiplier = e.getAmount().divide(avg, 2, RoundingMode.HALF_UP);
                    if (multiplier.compareTo(new BigDecimal("2.20")) >= 0 && multiplier.compareTo(highestMultiplier) > 0) {
                        highestMultiplier = multiplier;
                        mostUnusualExpense = e;
                        unusualCat = cat;
                        unusualCatAvg = avg;
                    }
                }
            }
        }

        if (mostUnusualExpense != null) {
            String label = mostUnusualExpense.getMerchant() != null && !mostUnusualExpense.getMerchant().isBlank()
                    ? mostUnusualExpense.getMerchant()
                    : unusualCat;

            candidates.add(InsightDto.builder()
                    .id("anomaly-" + mostUnusualExpense.getId())
                    .type(InsightType.ANOMALY_UNUSUAL_EXPENSE)
                    .severity(InsightSeverity.INFO)
                    .category("UNUSUAL SPENDING")
                    .title(String.format("Higher than normal %s transaction", unusualCat))
                    .description(String.format("%s %s at %s is significantly above your typical %s %s average for %s.",
                            currency, formatNumber(mostUnusualExpense.getAmount()), label, currency, formatNumber(unusualCatAvg), unusualCat))
                    .metric(String.format("%s %s", currency, formatNumber(mostUnusualExpense.getAmount())))
                    .value(mostUnusualExpense.getAmount().doubleValue())
                    .period(period)
                    .impactScore(88.0)
                    .build());
        }
    }

    private List<InsightDto> rankAndDeduplicateInsights(List<InsightDto> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Sort by impact score descending
        candidates.sort(Comparator.comparingDouble(InsightDto::getImpactScore).reversed());

        List<InsightDto> filtered = new ArrayList<>();
        Set<String> seenCategories = new HashSet<>();

        for (InsightDto item : candidates) {
            // Avoid duplicate category insights if they are similar
            String catKey = item.getCategory();
            if (item.getType() == InsightType.TOP_CATEGORY && seenCategories.contains(catKey)) {
                continue;
            }

            filtered.add(item);
            seenCategories.add(catKey);

            if (filtered.size() >= 5) {
                break;
            }
        }

        return filtered;
    }

    private String formatNumber(BigDecimal value) {
        if (value == null) return "0";
        return String.format("%,.0f", value);
    }

    private String sanitizeId(String input) {
        if (input == null) return "item";
        return input.toLowerCase().replaceAll("[^a-z0-9]", "-");
    }
}

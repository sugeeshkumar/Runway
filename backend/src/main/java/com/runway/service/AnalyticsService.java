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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BudgetRepository budgetRepository;

    public AnalyticsService(ExpenseRepository expenseRepository,
                             CategoryRepository categoryRepository,
                             UserRepository userRepository,
                             BudgetRepository budgetRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsInsightsDto getAnalyticsInsights(UUID userId, String periodStr, String granularityStr) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String userCurrency = user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR";

        String period = (periodStr != null && !periodStr.isBlank()) ? periodStr.toUpperCase() : "THIS_MONTH";
        String granularity = (granularityStr != null && !granularityStr.isBlank()) ? granularityStr.toUpperCase() : "DAILY";

        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zoneId);

        Instant startInstant;
        Instant endInstant;
        Instant prevStartInstant;
        Instant prevEndInstant;
        long totalDaysInPeriod;

        switch (period) {
            case "LAST_MONTH": {
                YearMonth ym = YearMonth.now(zoneId).minusMonths(1);
                startInstant = ym.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = ym.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevYm = ym.minusMonths(1);
                prevStartInstant = prevYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                totalDaysInPeriod = ym.lengthOfMonth();
                break;
            }
            case "LAST_3_MONTHS": {
                YearMonth currentYm = YearMonth.now(zoneId);
                YearMonth startYm = currentYm.minusMonths(2);
                startInstant = startYm.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = currentYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevEndYm = startYm.minusMonths(1);
                YearMonth prevStartYm = prevEndYm.minusMonths(2);
                prevStartInstant = prevStartYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevEndYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                totalDaysInPeriod = Duration.between(startInstant, endInstant).toDays() + 1;
                break;
            }
            case "THIS_YEAR": {
                int year = today.getYear();
                startInstant = LocalDate.of(year, 1, 1).atStartOfDay(zoneId).toInstant();
                endInstant = LocalDate.of(year, 12, 31).atTime(23, 59, 59).atZone(zoneId).toInstant();

                prevStartInstant = LocalDate.of(year - 1, 1, 1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = LocalDate.of(year - 1, 12, 31).atTime(23, 59, 59).atZone(zoneId).toInstant();
                totalDaysInPeriod = Year.of(year).isLeap() ? 366 : 365;
                break;
            }
            case "THIS_MONTH":
            default: {
                YearMonth currentYm = YearMonth.now(zoneId);
                startInstant = currentYm.atDay(1).atStartOfDay(zoneId).toInstant();
                endInstant = currentYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();

                YearMonth prevYm = currentYm.minusMonths(1);
                prevStartInstant = prevYm.atDay(1).atStartOfDay(zoneId).toInstant();
                prevEndInstant = prevYm.atEndOfMonth().atTime(23, 59, 59).atZone(zoneId).toInstant();
                totalDaysInPeriod = today.getDayOfMonth();
                break;
            }
        }

        List<Expense> expenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, startInstant, endInstant);
        List<Expense> prevExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, prevStartInstant, prevEndInstant);

        boolean hasEnoughData = expenses.size() >= 1;

        // 1. Overview metrics
        BigDecimal totalSpent = expenses.stream()
                .map(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal prevTotalSpent = prevExpenses.stream()
                .map(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long totalTransactions = expenses.size();

        BigDecimal averageDailySpent = (totalDaysInPeriod > 0)
                ? totalSpent.divide(BigDecimal.valueOf(totalDaysInPeriod), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Expense largestExpense = expenses.stream()
                .max(Comparator.comparing(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency)))
                .orElse(null);

        BigDecimal largestExpenseAmount = largestExpense != null
                ? DashboardService.convertAmount(largestExpense.getAmount(), largestExpense.getCurrency(), userCurrency).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        String largestExpenseDesc = largestExpense != null ? largestExpense.getDescription() : null;
        String largestExpenseMerchant = largestExpense != null ? largestExpense.getMerchant() : null;
        String largestExpenseDate = largestExpense != null ? largestExpense.getOccurredAt().atZone(zoneId).toLocalDate().toString() : null;

        double periodDeltaPercentage = 0.0;
        if (prevTotalSpent.compareTo(BigDecimal.ZERO) > 0) {
            periodDeltaPercentage = totalSpent.subtract(prevTotalSpent)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevTotalSpent, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        } else if (totalSpent.compareTo(BigDecimal.ZERO) > 0) {
            periodDeltaPercentage = 100.0;
        }

        AnalyticsInsightsDto.AnalyticsOverviewDto overview = new AnalyticsInsightsDto.AnalyticsOverviewDto(
                totalSpent, averageDailySpent, totalTransactions, largestExpenseAmount,
                largestExpenseDesc, largestExpenseMerchant, largestExpenseDate,
                prevTotalSpent, periodDeltaPercentage
        );

        // 2. Spending Over Time
        List<AnalyticsInsightsDto.TimeTrendPointDto> spendingOverTime = calculateTimeTrend(expenses, startInstant, endInstant, granularity, userCurrency, zoneId);

        // 3. Category Analysis
        Map<Category, BigDecimal> catTotals = new HashMap<>();
        Map<Category, Long> catCounts = new HashMap<>();
        for (Expense e : expenses) {
            BigDecimal amt = DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency);
            Category cat = e.getCategory();
            catTotals.merge(cat, amt, BigDecimal::add);
            catCounts.merge(cat, 1L, Long::sum);
        }

        List<AnalyticsInsightsDto.CategoryAnalysisDto> categoryAnalysis = catTotals.entrySet().stream()
                .map(entry -> {
                    Category cat = entry.getKey();
                    BigDecimal amt = entry.getValue().setScale(2, RoundingMode.HALF_UP);
                    long count = catCounts.getOrDefault(cat, 0L);
                    double pct = totalSpent.compareTo(BigDecimal.ZERO) > 0
                            ? amt.multiply(BigDecimal.valueOf(100)).divide(totalSpent, 2, RoundingMode.HALF_UP).doubleValue()
                            : 0.0;
                    return new AnalyticsInsightsDto.CategoryAnalysisDto(
                            cat != null ? cat.getId() : null,
                            cat != null ? cat.getName() : "Uncategorized",
                            cat != null ? cat.getColor() : "#6B7280",
                            amt, pct, count
                    );
                })
                .sorted(Comparator.comparing(AnalyticsInsightsDto.CategoryAnalysisDto::getTotalAmount, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        // 4. Derived Spending Patterns
        List<String> spendingPatterns = new ArrayList<>();
        if (hasEnoughData && !categoryAnalysis.isEmpty()) {
            AnalyticsInsightsDto.CategoryAnalysisDto topCat = categoryAnalysis.get(0);
            spendingPatterns.add(String.format("%s is your highest-spending category, accounting for %.1f%% of total expenditure.", topCat.getCategoryName(), topCat.getPercentage()));

            // Find peak day of week
            Map<DayOfWeek, BigDecimal> dowTotals = new EnumMap<>(DayOfWeek.class);
            Map<DayOfWeek, Long> dowCounts = new EnumMap<>(DayOfWeek.class);
            for (Expense e : expenses) {
                DayOfWeek dow = e.getOccurredAt().atZone(zoneId).getDayOfWeek();
                BigDecimal amt = DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency);
                dowTotals.merge(dow, amt, BigDecimal::add);
                dowCounts.merge(dow, 1L, Long::sum);
            }
            Map.Entry<DayOfWeek, BigDecimal> peakDow = dowTotals.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);
            if (peakDow != null && peakDow.getValue().compareTo(BigDecimal.ZERO) > 0) {
                String dayName = peakDow.getKey().name().substring(0, 1) + peakDow.getKey().name().substring(1).toLowerCase();
                long count = dowCounts.getOrDefault(peakDow.getKey(), 0L);
                spendingPatterns.add(String.format("%s saw your peak spending total (%s across %d transaction%s).", dayName, userCurrency + " " + peakDow.getValue().setScale(2, RoundingMode.HALF_UP), count, count > 1 ? "s" : ""));
            }

            // Average transaction size
            if (totalTransactions > 0) {
                BigDecimal avgTxn = totalSpent.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP);
                spendingPatterns.add(String.format("Average transaction size across %d logged item%s is %s %s.", totalTransactions, totalTransactions > 1 ? "s" : "", userCurrency, avgTxn));
            }

            // Acceleration / Slowdown message
            if (prevTotalSpent.compareTo(BigDecimal.ZERO) > 0) {
                if (periodDeltaPercentage < 0) {
                    spendingPatterns.add(String.format("Spending velocity slowed by %.1f%% compared to the previous equivalent period.", Math.abs(periodDeltaPercentage)));
                } else if (periodDeltaPercentage > 0) {
                    spendingPatterns.add(String.format("Spending velocity accelerated by +%.1f%% vs previous equivalent period.", periodDeltaPercentage));
                } else {
                    spendingPatterns.add("Spending velocity is identical to the previous equivalent period.");
                }
            }
        }

        // 5. Budget Relationship & Projection
        YearMonth currentYm = YearMonth.now(zoneId);
        Optional<Budget> overallBudgetOpt = budgetRepository.findByUserIdAndCategoryIsNullAndPeriodMonth(userId, currentYm.toString());
        BigDecimal overallBudgetAmount = overallBudgetOpt.map(Budget::getAmount).orElse(new BigDecimal("2000"));
        BigDecimal remainingBudget = overallBudgetAmount.subtract(totalSpent);
        double percentageUsed = overallBudgetAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.divide(overallBudgetAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        BigDecimal projectedEomTotal = BigDecimal.ZERO;
        boolean isProjectionAvailable = false;
        String projectionNotice = null;

        if (period.equals("THIS_MONTH") && today.getDayOfMonth() >= 3 && totalTransactions >= 2) {
            int elapsedDays = today.getDayOfMonth();
            int totalDaysInMonth = currentYm.lengthOfMonth();
            BigDecimal dailyPace = totalSpent.divide(BigDecimal.valueOf(elapsedDays), 4, RoundingMode.HALF_UP);
            projectedEomTotal = dailyPace.multiply(BigDecimal.valueOf(totalDaysInMonth)).setScale(2, RoundingMode.HALF_UP);
            isProjectionAvailable = true;
            projectionNotice = String.format("*Estimated end-of-month spending based on current daily velocity of %s %s/day across %d elapsed days.", userCurrency, dailyPace.setScale(2, RoundingMode.HALF_UP), elapsedDays);
        } else if (period.equals("THIS_MONTH")) {
            projectionNotice = "End-of-month projection requires at least 3 days of activity in the current month.";
        }

        AnalyticsInsightsDto.BudgetRelationshipDto budgetRelationship = new AnalyticsInsightsDto.BudgetRelationshipDto(
                overallBudgetAmount, totalSpent, remainingBudget, percentageUsed,
                projectedEomTotal, isProjectionAvailable, projectionNotice
        );

        return AnalyticsInsightsDto.builder()
                .period(period)
                .granularity(granularity)
                .currency(userCurrency)
                .hasEnoughData(hasEnoughData)
                .overview(overview)
                .spendingOverTime(spendingOverTime)
                .categoryAnalysis(categoryAnalysis)
                .spendingPatterns(spendingPatterns)
                .budgetRelationship(budgetRelationship)
                .build();
    }

    private List<AnalyticsInsightsDto.TimeTrendPointDto> calculateTimeTrend(
            List<Expense> expenses, Instant startInstant, Instant endInstant,
            String granularity, String userCurrency, ZoneId zoneId) {

        List<AnalyticsInsightsDto.TimeTrendPointDto> trend = new ArrayList<>();
        LocalDate startDate = startInstant.atZone(zoneId).toLocalDate();
        LocalDate endDate = endInstant.atZone(zoneId).toLocalDate();

        if (granularity.equalsIgnoreCase("WEEKLY")) {
            Map<LocalDate, List<Expense>> weekMap = new LinkedHashMap<>();
            LocalDate current = startDate.with(DayOfWeek.MONDAY);
            while (!current.isAfter(endDate)) {
                weekMap.put(current, new ArrayList<>());
                current = current.plusWeeks(1);
            }

            for (Expense e : expenses) {
                LocalDate eDate = e.getOccurredAt().atZone(zoneId).toLocalDate();
                LocalDate weekStart = eDate.with(DayOfWeek.MONDAY);
                if (weekMap.containsKey(weekStart)) {
                    weekMap.get(weekStart).add(e);
                }
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
            for (Map.Entry<LocalDate, List<Expense>> entry : weekMap.entrySet()) {
                LocalDate wStart = entry.getKey();
                LocalDate wEnd = wStart.plusDays(6);
                String label = wStart.format(formatter) + " - " + wEnd.format(formatter);
                List<Expense> eList = entry.getValue();
                BigDecimal total = eList.stream().map(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency)).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
                trend.add(new AnalyticsInsightsDto.TimeTrendPointDto(label, wStart.toString(), wEnd.toString(), total, eList.size()));
            }

        } else if (granularity.equalsIgnoreCase("MONTHLY")) {
            Map<YearMonth, List<Expense>> monthMap = new LinkedHashMap<>();
            YearMonth startYm = YearMonth.from(startDate);
            YearMonth endYm = YearMonth.from(endDate);

            YearMonth ymIter = startYm;
            while (!ymIter.isAfter(endYm)) {
                monthMap.put(ymIter, new ArrayList<>());
                ymIter = ymIter.plusMonths(1);
            }

            for (Expense e : expenses) {
                YearMonth eYm = YearMonth.from(e.getOccurredAt().atZone(zoneId));
                if (monthMap.containsKey(eYm)) {
                    monthMap.get(eYm).add(e);
                }
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
            for (Map.Entry<YearMonth, List<Expense>> entry : monthMap.entrySet()) {
                YearMonth ym = entry.getKey();
                String label = ym.format(formatter);
                List<Expense> eList = entry.getValue();
                BigDecimal total = eList.stream().map(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency)).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
                trend.add(new AnalyticsInsightsDto.TimeTrendPointDto(label, ym.atDay(1).toString(), ym.atEndOfMonth().toString(), total, eList.size()));
            }

        } else {
            // DAILY
            Map<LocalDate, List<Expense>> dayMap = new LinkedHashMap<>();
            LocalDate current = startDate;
            LocalDate effectiveEnd = endDate.isAfter(startDate.plusDays(60)) ? startDate.plusDays(60) : endDate;
            while (!current.isAfter(effectiveEnd)) {
                dayMap.put(current, new ArrayList<>());
                current = current.plusDays(1);
            }

            for (Expense e : expenses) {
                LocalDate eDate = e.getOccurredAt().atZone(zoneId).toLocalDate();
                if (dayMap.containsKey(eDate)) {
                    dayMap.get(eDate).add(e);
                }
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
            for (Map.Entry<LocalDate, List<Expense>> entry : dayMap.entrySet()) {
                LocalDate date = entry.getKey();
                String label = date.format(formatter);
                List<Expense> eList = entry.getValue();
                BigDecimal total = eList.stream().map(e -> DashboardService.convertAmount(e.getAmount(), e.getCurrency(), userCurrency)).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
                trend.add(new AnalyticsInsightsDto.TimeTrendPointDto(label, date.toString(), date.toString(), total, eList.size()));
            }
        }

        return trend;
    }

    @Transactional(readOnly = true)
    public List<CategoryTrendDto> getCategoryTrends(UUID userId, int months) {
        if (months <= 0) months = 6;
        YearMonth currentYm = YearMonth.now();
        YearMonth startYm = currentYm.minusMonths(months - 1);
        Instant startInstant = startYm.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Expense> expenses = expenseRepository.findByUserIdAndOccurredAtGreaterThanEqualOrderByOccurredAtDesc(userId, startInstant);

        Map<String, Map<Category, BigDecimal>> monthlyCategoryTotals = new HashMap<>();

        for (Expense e : expenses) {
            LocalDate date = e.getOccurredAt().atZone(ZoneId.systemDefault()).toLocalDate();
            String periodMonth = String.format("%04d-%02d", date.getYear(), date.getMonthValue());
            Category cat = e.getCategory();

            monthlyCategoryTotals
                    .computeIfAbsent(periodMonth, k -> new HashMap<>())
                    .merge(cat, e.getAmount(), BigDecimal::add);
        }

        List<CategoryTrendDto> result = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = currentYm.minusMonths(i);
            String periodStr = ym.format(formatter);
            Map<Category, BigDecimal> catMap = monthlyCategoryTotals.getOrDefault(periodStr, Collections.emptyMap());

            for (Map.Entry<Category, BigDecimal> entry : catMap.entrySet()) {
                Category cat = entry.getKey();
                result.add(CategoryTrendDto.builder()
                        .periodMonth(periodStr)
                        .categoryId(cat != null ? cat.getId() : null)
                        .categoryName(cat != null ? cat.getName() : "Uncategorized")
                        .color(cat != null ? cat.getColor() : "#6B7280")
                        .spentAmount(entry.getValue().setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        result.sort(Comparator.comparing(CategoryTrendDto::getPeriodMonth).thenComparing(CategoryTrendDto::getSpentAmount, Comparator.reverseOrder()));
        return result;
    }

    @Transactional(readOnly = true)
    public List<DayOfWeekSpendDto> getDayOfWeekHeatmap(UUID userId) {
        List<Expense> expenses = expenseRepository.findByUserIdOrderByOccurredAtDesc(userId);

        Map<DayOfWeek, BigDecimal> dayTotals = new EnumMap<>(DayOfWeek.class);
        Map<DayOfWeek, Long> dayCounts = new EnumMap<>(DayOfWeek.class);

        for (DayOfWeek dow : DayOfWeek.values()) {
            dayTotals.put(dow, BigDecimal.ZERO);
            dayCounts.put(dow, 0L);
        }

        for (Expense e : expenses) {
            DayOfWeek dow = e.getOccurredAt().atZone(ZoneId.systemDefault()).getDayOfWeek();
            dayTotals.merge(dow, e.getAmount(), BigDecimal::add);
            dayCounts.merge(dow, 1L, Long::sum);
        }

        BigDecimal maxSpend = dayTotals.values().stream().max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
        if (maxSpend.compareTo(BigDecimal.ZERO) == 0) maxSpend = BigDecimal.ONE;

        List<DayOfWeekSpendDto> heatmap = new ArrayList<>();
        String[] dayNames = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};

        for (int i = 1; i <= 7; i++) {
            DayOfWeek dow = DayOfWeek.of(i);
            BigDecimal total = dayTotals.get(dow).setScale(2, RoundingMode.HALF_UP);
            long count = dayCounts.get(dow);
            double intensity = total.multiply(BigDecimal.valueOf(100)).divide(maxSpend, 2, RoundingMode.HALF_UP).doubleValue();

            heatmap.add(DayOfWeekSpendDto.builder()
                    .dayOfWeek(i)
                    .dayName(dayNames[i - 1])
                    .totalSpent(total)
                    .transactionCount(count)
                    .intensityPercentage(intensity)
                    .build());
        }

        return heatmap;
    }

    @Transactional(readOnly = true)
    public MonthOverMonthComparisonDto getMonthOverMonth(UUID userId) {
        YearMonth currentYm = YearMonth.now();
        YearMonth prevYm = currentYm.minusMonths(1);

        String currentMonthStr = currentYm.toString();
        String prevMonthStr = prevYm.toString();

        Instant currentStart = currentYm.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant currentEnd = currentYm.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        Instant prevStart = prevYm.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant prevEnd = prevYm.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<Expense> currentExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, currentStart, currentEnd);
        List<Expense> prevExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, prevStart, prevEnd);

        BigDecimal currentTotal = currentExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal prevTotal = prevExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal overallDelta = currentTotal.subtract(prevTotal);
        double overallPct = 0.0;
        if (prevTotal.compareTo(BigDecimal.ZERO) > 0) {
            overallPct = overallDelta.multiply(BigDecimal.valueOf(100)).divide(prevTotal, 2, RoundingMode.HALF_UP).doubleValue();
        } else if (currentTotal.compareTo(BigDecimal.ZERO) > 0) {
            overallPct = 100.0;
        }

        Map<Category, BigDecimal> currentCatMap = currentExpenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory, Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));

        Map<Category, BigDecimal> prevCatMap = prevExpenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory, Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));

        Set<Category> allCategories = new HashSet<>();
        allCategories.addAll(currentCatMap.keySet());
        allCategories.addAll(prevCatMap.keySet());

        List<CategoryDeltaDto> categoryDeltas = new ArrayList<>();
        for (Category cat : allCategories) {
            BigDecimal curSpent = currentCatMap.getOrDefault(cat, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal prvSpent = prevCatMap.getOrDefault(cat, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal delta = curSpent.subtract(prvSpent);

            double pct = 0.0;
            if (prvSpent.compareTo(BigDecimal.ZERO) > 0) {
                pct = delta.multiply(BigDecimal.valueOf(100)).divide(prvSpent, 2, RoundingMode.HALF_UP).doubleValue();
            } else if (curSpent.compareTo(BigDecimal.ZERO) > 0) {
                pct = 100.0;
            }

            categoryDeltas.add(CategoryDeltaDto.builder()
                    .categoryId(cat != null ? cat.getId() : null)
                    .categoryName(cat != null ? cat.getName() : "Uncategorized")
                    .color(cat != null ? cat.getColor() : "#6B7280")
                    .currentSpent(curSpent)
                    .previousSpent(prvSpent)
                    .deltaAmount(delta)
                    .deltaPercentage(pct)
                    .build());
        }

        categoryDeltas.sort(Comparator.comparing(CategoryDeltaDto::getCurrentSpent, Comparator.reverseOrder()));

        return MonthOverMonthComparisonDto.builder()
                .currentMonth(currentMonthStr)
                .previousMonth(prevMonthStr)
                .currentTotalSpent(currentTotal.setScale(2, RoundingMode.HALF_UP))
                .previousTotalSpent(prevTotal.setScale(2, RoundingMode.HALF_UP))
                .overallDeltaAmount(overallDelta.setScale(2, RoundingMode.HALF_UP))
                .overallDeltaPercentage(overallPct)
                .categoryDeltas(categoryDeltas)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MerchantSpendDto> getMerchantBreakdown(UUID userId, int limit) {
        if (limit <= 0) limit = 10;
        List<Expense> expenses = expenseRepository.findByUserIdOrderByOccurredAtDesc(userId);

        BigDecimal grandTotal = expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (grandTotal.compareTo(BigDecimal.ZERO) == 0) grandTotal = BigDecimal.ONE;

        Map<String, List<Expense>> merchantGroups = new HashMap<>();
        for (Expense e : expenses) {
            String name = e.getMerchant();
            if (name == null || name.trim().isEmpty()) {
                name = e.getDescription();
            }
            if (name == null || name.trim().isEmpty()) {
                name = "Other Vendor";
            }
            merchantGroups.computeIfAbsent(name.trim(), k -> new ArrayList<>()).add(e);
        }

        List<MerchantSpendDto> list = new ArrayList<>();
        for (Map.Entry<String, List<Expense>> entry : merchantGroups.entrySet()) {
            String name = entry.getKey();
            List<Expense> mExpenses = entry.getValue();

            BigDecimal totalSpent = mExpenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
            long count = mExpenses.size();
            double pct = totalSpent.multiply(BigDecimal.valueOf(100)).divide(grandTotal, 2, RoundingMode.HALF_UP).doubleValue();

            list.add(MerchantSpendDto.builder()
                    .merchantName(name)
                    .totalSpent(totalSpent)
                    .transactionCount(count)
                    .percentageOfTotal(pct)
                    .build());
        }

        list.sort(Comparator.comparing(MerchantSpendDto::getTotalSpent, Comparator.reverseOrder()));
        return list.stream().limit(limit).collect(Collectors.toList());
    }
}

package com.runway.service;

import com.runway.dto.CreateExpenseRequest;
import com.runway.dto.ExpenseDto;
import com.runway.dto.UpdateExpenseRequest;
import com.runway.entity.Category;
import com.runway.entity.Expense;
import com.runway.entity.User;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository, CategoryRepository categoryRepository, CategoryService categoryService) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpensesForUser(UUID userId) {
        return expenseRepository.findByUserIdOrderByOccurredAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ExpenseDto createExpense(UUID userId, CreateExpenseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized category access");
        }

        Instant occurredAt = request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now();

        Expense expense = Expense.builder()
                .user(user)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .category(category)
                .merchant(request.getMerchant())
                .description(request.getDescription() != null ? request.getDescription() : category.getName())
                .occurredAt(occurredAt)
                .source(request.getSource())
                .rawInput(request.getRawInput())
                .build();

        expense = expenseRepository.save(expense);
        return mapToDto(expense);
    }

    @Transactional
    public ExpenseDto updateExpense(UUID userId, UUID expenseId, UpdateExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to update this expense");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized category access");
        }

        expense.setAmount(request.getAmount());
        if (request.getCurrency() != null) expense.setCurrency(request.getCurrency());
        expense.setCategory(category);
        expense.setMerchant(request.getMerchant());
        if (request.getDescription() != null) expense.setDescription(request.getDescription());
        if (request.getOccurredAt() != null) expense.setOccurredAt(request.getOccurredAt());
        if (request.getSource() != null) expense.setSource(request.getSource());

        expense = expenseRepository.save(expense);
        return mapToDto(expense);
    }

    @Transactional
    public void deleteExpense(UUID userId, UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this expense");
        }

        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public com.runway.dto.DuplicateCheckDto checkDuplicate(UUID userId, java.math.BigDecimal amount, String merchant, String description, UUID categoryId, Instant occurredAt) {
        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return new com.runway.dto.DuplicateCheckDto(false, null, null, amount, merchant, null);
        }

        Instant checkTime = occurredAt != null ? occurredAt : Instant.now();
        Instant windowStart = checkTime.minus(java.time.Duration.ofMinutes(10));
        Instant windowEnd = checkTime.plus(java.time.Duration.ofMinutes(10));

        List<Expense> candidateExpenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, windowStart, windowEnd);

        for (Expense candidate : candidateExpenses) {
            if (candidate.getAmount().subtract(amount).abs().compareTo(new java.math.BigDecimal("0.01")) < 0) {
                boolean merchantMatch = (merchant != null && candidate.getMerchant() != null && merchant.equalsIgnoreCase(candidate.getMerchant()));
                boolean descMatch = (description != null && candidate.getDescription() != null && description.equalsIgnoreCase(candidate.getDescription()));
                boolean catMatch = (categoryId != null && candidate.getCategory() != null && categoryId.equals(candidate.getCategory().getId()));

                if (merchantMatch || descMatch || catMatch) {
                    long minutesAgo = Math.max(1, java.time.Duration.between(candidate.getCreatedAt() != null ? candidate.getCreatedAt() : candidate.getOccurredAt(), Instant.now()).toMinutes());
                    String timeAgoMsg = String.format("recorded %d minute%s ago", minutesAgo, minutesAgo > 1 ? "s" : "");
                    return new com.runway.dto.DuplicateCheckDto(true, candidate.getId(), timeAgoMsg, candidate.getAmount(), candidate.getMerchant(), candidate.getCategory().getName());
                }
            }
        }

        return new com.runway.dto.DuplicateCheckDto(false, null, null, amount, merchant, null);
    }

    @Transactional(readOnly = true)
    public List<com.runway.dto.CalendarDaySpendDto> getCalendarMonthSummary(UUID userId, Integer year, Integer month) {
        java.time.YearMonth ym;
        if (year != null && month != null) {
            ym = java.time.YearMonth.of(year, month);
        } else {
            ym = java.time.YearMonth.now();
        }

        java.time.Instant startInstant = ym.atDay(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
        java.time.Instant endInstant = ym.atEndOfMonth().atTime(23, 59, 59).atZone(java.time.ZoneId.systemDefault()).toInstant();

        List<Expense> expenses = expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(userId, startInstant, endInstant);

        Map<java.time.LocalDate, List<Expense>> dayExpensesMap = expenses.stream()
                .collect(Collectors.groupingBy(e -> e.getOccurredAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate()));

        java.math.BigDecimal maxDaySpend = java.math.BigDecimal.ONE;
        for (List<Expense> dayList : dayExpensesMap.values()) {
            java.math.BigDecimal total = dayList.stream().map(Expense::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            if (total.compareTo(maxDaySpend) > 0) {
                maxDaySpend = total;
            }
        }

        List<com.runway.dto.CalendarDaySpendDto> result = new ArrayList<>();
        int daysInMonth = ym.lengthOfMonth();

        for (int day = 1; day <= daysInMonth; day++) {
            java.time.LocalDate date = ym.atDay(day);
            List<Expense> dayList = dayExpensesMap.getOrDefault(date, Collections.emptyList());

            java.math.BigDecimal totalSpent = dayList.stream().map(Expense::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add).setScale(2, java.math.RoundingMode.HALF_UP);
            long count = dayList.size();
            double intensity = totalSpent.multiply(java.math.BigDecimal.valueOf(100)).divide(maxDaySpend, 2, java.math.RoundingMode.HALF_UP).doubleValue();

            Map<Category, java.math.BigDecimal> catTotals = dayList.stream()
                    .collect(Collectors.groupingBy(Expense::getCategory, Collectors.reducing(java.math.BigDecimal.ZERO, Expense::getAmount, java.math.BigDecimal::add)));

            List<com.runway.dto.CategorySummaryDto> catSplits = catTotals.entrySet().stream()
                    .map(entry -> new com.runway.dto.CategorySummaryDto(
                            entry.getKey() != null ? entry.getKey().getId() : null,
                            entry.getKey() != null ? entry.getKey().getName() : "Uncategorized",
                            entry.getKey() != null ? entry.getKey().getColor() : "#6B7280",
                            entry.getValue().setScale(2, java.math.RoundingMode.HALF_UP),
                            totalSpent.compareTo(java.math.BigDecimal.ZERO) > 0 ? entry.getValue().multiply(java.math.BigDecimal.valueOf(100)).divide(totalSpent, 2, java.math.RoundingMode.HALF_UP).doubleValue() : 0.0
                    ))
                    .collect(Collectors.toList());

            List<ExpenseDto> dtos = dayList.stream().map(this::mapToDto).collect(Collectors.toList());

            result.add(com.runway.dto.CalendarDaySpendDto.builder()
                    .date(date)
                    .totalSpent(totalSpent)
                    .transactionCount(count)
                    .intensityPercentage(intensity)
                    .categorySplits(catSplits)
                    .expenses(dtos)
                    .build());
        }

        return result;
    }

    public ExpenseDto mapToDto(Expense e) {
        return ExpenseDto.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .amount(e.getAmount())
                .currency(e.getCurrency())
                .category(categoryService.mapToDto(e.getCategory()))
                .merchant(e.getMerchant())
                .description(e.getDescription())
                .occurredAt(e.getOccurredAt())
                .source(e.getSource())
                .rawInput(e.getRawInput())
                .createdAt(e.getCreatedAt())
                .build();
    }
}

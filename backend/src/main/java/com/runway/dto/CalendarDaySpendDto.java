package com.runway.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CalendarDaySpendDto {
    private LocalDate date;
    private BigDecimal totalSpent;
    private long transactionCount;
    private double intensityPercentage;
    private List<CategorySummaryDto> categorySplits;
    private List<ExpenseDto> expenses;

    public CalendarDaySpendDto() {}

    public CalendarDaySpendDto(LocalDate date, BigDecimal totalSpent, long transactionCount, double intensityPercentage, List<CategorySummaryDto> categorySplits, List<ExpenseDto> expenses) {
        this.date = date;
        this.totalSpent = totalSpent;
        this.transactionCount = transactionCount;
        this.intensityPercentage = intensityPercentage;
        this.categorySplits = categorySplits;
        this.expenses = expenses;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(long transactionCount) { this.transactionCount = transactionCount; }

    public double getIntensityPercentage() { return intensityPercentage; }
    public void setIntensityPercentage(double intensityPercentage) { this.intensityPercentage = intensityPercentage; }

    public List<CategorySummaryDto> getCategorySplits() { return categorySplits; }
    public void setCategorySplits(List<CategorySummaryDto> categorySplits) { this.categorySplits = categorySplits; }

    public List<ExpenseDto> getExpenses() { return expenses; }
    public void setExpenses(List<ExpenseDto> expenses) { this.expenses = expenses; }

    public static CalendarDaySpendDtoBuilder builder() { return new CalendarDaySpendDtoBuilder(); }

    public static class CalendarDaySpendDtoBuilder {
        private LocalDate date;
        private BigDecimal totalSpent;
        private long transactionCount;
        private double intensityPercentage;
        private List<CategorySummaryDto> categorySplits;
        private List<ExpenseDto> expenses;

        public CalendarDaySpendDtoBuilder date(LocalDate date) { this.date = date; return this; }
        public CalendarDaySpendDtoBuilder totalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; return this; }
        public CalendarDaySpendDtoBuilder transactionCount(long transactionCount) { this.transactionCount = transactionCount; return this; }
        public CalendarDaySpendDtoBuilder intensityPercentage(double intensityPercentage) { this.intensityPercentage = intensityPercentage; return this; }
        public CalendarDaySpendDtoBuilder categorySplits(List<CategorySummaryDto> categorySplits) { this.categorySplits = categorySplits; return this; }
        public CalendarDaySpendDtoBuilder expenses(List<ExpenseDto> expenses) { this.expenses = expenses; return this; }

        public CalendarDaySpendDto build() {
            return new CalendarDaySpendDto(date, totalSpent, transactionCount, intensityPercentage, categorySplits, expenses);
        }
    }
}

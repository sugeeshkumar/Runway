package com.runway.dto;

import java.math.BigDecimal;
import java.util.List;

public class MonthOverMonthComparisonDto {
    private String currentMonth; // YYYY-MM
    private String previousMonth; // YYYY-MM
    private BigDecimal currentTotalSpent;
    private BigDecimal previousTotalSpent;
    private BigDecimal overallDeltaAmount;
    private double overallDeltaPercentage;
    private List<CategoryDeltaDto> categoryDeltas;

    public MonthOverMonthComparisonDto() {}

    public MonthOverMonthComparisonDto(String currentMonth, String previousMonth, BigDecimal currentTotalSpent, BigDecimal previousTotalSpent, BigDecimal overallDeltaAmount, double overallDeltaPercentage, List<CategoryDeltaDto> categoryDeltas) {
        this.currentMonth = currentMonth;
        this.previousMonth = previousMonth;
        this.currentTotalSpent = currentTotalSpent;
        this.previousTotalSpent = previousTotalSpent;
        this.overallDeltaAmount = overallDeltaAmount;
        this.overallDeltaPercentage = overallDeltaPercentage;
        this.categoryDeltas = categoryDeltas;
    }

    public String getCurrentMonth() { return currentMonth; }
    public void setCurrentMonth(String currentMonth) { this.currentMonth = currentMonth; }

    public String getPreviousMonth() { return previousMonth; }
    public void setPreviousMonth(String previousMonth) { this.previousMonth = previousMonth; }

    public BigDecimal getCurrentTotalSpent() { return currentTotalSpent; }
    public void setCurrentTotalSpent(BigDecimal currentTotalSpent) { this.currentTotalSpent = currentTotalSpent; }

    public BigDecimal getPreviousTotalSpent() { return previousTotalSpent; }
    public void setPreviousTotalSpent(BigDecimal previousTotalSpent) { this.previousTotalSpent = previousTotalSpent; }

    public BigDecimal getOverallDeltaAmount() { return overallDeltaAmount; }
    public void setOverallDeltaAmount(BigDecimal overallDeltaAmount) { this.overallDeltaAmount = overallDeltaAmount; }

    public double getOverallDeltaPercentage() { return overallDeltaPercentage; }
    public void setOverallDeltaPercentage(double overallDeltaPercentage) { this.overallDeltaPercentage = overallDeltaPercentage; }

    public List<CategoryDeltaDto> getCategoryDeltas() { return categoryDeltas; }
    public void setCategoryDeltas(List<CategoryDeltaDto> categoryDeltas) { this.categoryDeltas = categoryDeltas; }

    public static MonthOverMonthComparisonDtoBuilder builder() { return new MonthOverMonthComparisonDtoBuilder(); }

    public static class MonthOverMonthComparisonDtoBuilder {
        private String currentMonth;
        private String previousMonth;
        private BigDecimal currentTotalSpent;
        private BigDecimal previousTotalSpent;
        private BigDecimal overallDeltaAmount;
        private double overallDeltaPercentage;
        private List<CategoryDeltaDto> categoryDeltas;

        public MonthOverMonthComparisonDtoBuilder currentMonth(String currentMonth) { this.currentMonth = currentMonth; return this; }
        public MonthOverMonthComparisonDtoBuilder previousMonth(String previousMonth) { this.previousMonth = previousMonth; return this; }
        public MonthOverMonthComparisonDtoBuilder currentTotalSpent(BigDecimal currentTotalSpent) { this.currentTotalSpent = currentTotalSpent; return this; }
        public MonthOverMonthComparisonDtoBuilder previousTotalSpent(BigDecimal previousTotalSpent) { this.previousTotalSpent = previousTotalSpent; return this; }
        public MonthOverMonthComparisonDtoBuilder overallDeltaAmount(BigDecimal overallDeltaAmount) { this.overallDeltaAmount = overallDeltaAmount; return this; }
        public MonthOverMonthComparisonDtoBuilder overallDeltaPercentage(double overallDeltaPercentage) { this.overallDeltaPercentage = overallDeltaPercentage; return this; }
        public MonthOverMonthComparisonDtoBuilder categoryDeltas(List<CategoryDeltaDto> categoryDeltas) { this.categoryDeltas = categoryDeltas; return this; }

        public MonthOverMonthComparisonDto build() {
            return new MonthOverMonthComparisonDto(currentMonth, previousMonth, currentTotalSpent, previousTotalSpent, overallDeltaAmount, overallDeltaPercentage, categoryDeltas);
        }
    }
}

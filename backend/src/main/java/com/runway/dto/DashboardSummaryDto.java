package com.runway.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDto {
    private String periodMonth;
    private String userDefaultCurrency;
    private BigDecimal overallBudget;
    private BigDecimal totalSpent;
    private BigDecimal remainingBudget;
    private BudgetStatus budgetStatus;
    private BigDecimal previousMonthSpent;
    private BigDecimal monthOverMonthDeltaPercentage;
    private List<CategorySummaryDto> topCategories;
    private List<RecurringTemplateDto> upcomingRecurring;

    public DashboardSummaryDto() {}

    public DashboardSummaryDto(String periodMonth, String userDefaultCurrency, BigDecimal overallBudget, BigDecimal totalSpent, BigDecimal remainingBudget, BudgetStatus budgetStatus, BigDecimal previousMonthSpent, BigDecimal monthOverMonthDeltaPercentage, List<CategorySummaryDto> topCategories, List<RecurringTemplateDto> upcomingRecurring) {
        this.periodMonth = periodMonth;
        this.userDefaultCurrency = userDefaultCurrency;
        this.overallBudget = overallBudget;
        this.totalSpent = totalSpent;
        this.remainingBudget = remainingBudget;
        this.budgetStatus = budgetStatus;
        this.previousMonthSpent = previousMonthSpent;
        this.monthOverMonthDeltaPercentage = monthOverMonthDeltaPercentage;
        this.topCategories = topCategories;
        this.upcomingRecurring = upcomingRecurring;
    }

    public static DashboardSummaryDtoBuilder builder() {
        return new DashboardSummaryDtoBuilder();
    }

    public static class DashboardSummaryDtoBuilder {
        private String periodMonth;
        private String userDefaultCurrency;
        private BigDecimal overallBudget;
        private BigDecimal totalSpent;
        private BigDecimal remainingBudget;
        private BudgetStatus budgetStatus;
        private BigDecimal previousMonthSpent;
        private BigDecimal monthOverMonthDeltaPercentage;
        private List<CategorySummaryDto> topCategories;
        private List<RecurringTemplateDto> upcomingRecurring;

        public DashboardSummaryDtoBuilder periodMonth(String periodMonth) { this.periodMonth = periodMonth; return this; }
        public DashboardSummaryDtoBuilder userDefaultCurrency(String userDefaultCurrency) { this.userDefaultCurrency = userDefaultCurrency; return this; }
        public DashboardSummaryDtoBuilder overallBudget(BigDecimal overallBudget) { this.overallBudget = overallBudget; return this; }
        public DashboardSummaryDtoBuilder totalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; return this; }
        public DashboardSummaryDtoBuilder remainingBudget(BigDecimal remainingBudget) { this.remainingBudget = remainingBudget; return this; }
        public DashboardSummaryDtoBuilder budgetStatus(BudgetStatus budgetStatus) { this.budgetStatus = budgetStatus; return this; }
        public DashboardSummaryDtoBuilder previousMonthSpent(BigDecimal previousMonthSpent) { this.previousMonthSpent = previousMonthSpent; return this; }
        public DashboardSummaryDtoBuilder monthOverMonthDeltaPercentage(BigDecimal monthOverMonthDeltaPercentage) { this.monthOverMonthDeltaPercentage = monthOverMonthDeltaPercentage; return this; }
        public DashboardSummaryDtoBuilder topCategories(List<CategorySummaryDto> topCategories) { this.topCategories = topCategories; return this; }
        public DashboardSummaryDtoBuilder upcomingRecurring(List<RecurringTemplateDto> upcomingRecurring) { this.upcomingRecurring = upcomingRecurring; return this; }

        public DashboardSummaryDto build() {
            return new DashboardSummaryDto(periodMonth, userDefaultCurrency, overallBudget, totalSpent, remainingBudget, budgetStatus, previousMonthSpent, monthOverMonthDeltaPercentage, topCategories, upcomingRecurring);
        }
    }

    public String getPeriodMonth() { return periodMonth; }
    public void setPeriodMonth(String periodMonth) { this.periodMonth = periodMonth; }

    public String getUserDefaultCurrency() { return userDefaultCurrency; }
    public void setUserDefaultCurrency(String userDefaultCurrency) { this.userDefaultCurrency = userDefaultCurrency; }

    public BigDecimal getOverallBudget() { return overallBudget; }
    public void setOverallBudget(BigDecimal overallBudget) { this.overallBudget = overallBudget; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public BigDecimal getRemainingBudget() { return remainingBudget; }
    public void setRemainingBudget(BigDecimal remainingBudget) { this.remainingBudget = remainingBudget; }

    public BudgetStatus getBudgetStatus() { return budgetStatus; }
    public void setBudgetStatus(BudgetStatus budgetStatus) { this.budgetStatus = budgetStatus; }

    public BigDecimal getPreviousMonthSpent() { return previousMonthSpent; }
    public void setPreviousMonthSpent(BigDecimal previousMonthSpent) { this.previousMonthSpent = previousMonthSpent; }

    public BigDecimal getMonthOverMonthDeltaPercentage() { return monthOverMonthDeltaPercentage; }
    public void setMonthOverMonthDeltaPercentage(BigDecimal monthOverMonthDeltaPercentage) { this.monthOverMonthDeltaPercentage = monthOverMonthDeltaPercentage; }

    public List<CategorySummaryDto> getTopCategories() { return topCategories; }
    public void setTopCategories(List<CategorySummaryDto> topCategories) { this.topCategories = topCategories; }

    public List<RecurringTemplateDto> getUpcomingRecurring() { return upcomingRecurring; }
    public void setUpcomingRecurring(List<RecurringTemplateDto> upcomingRecurring) { this.upcomingRecurring = upcomingRecurring; }
}

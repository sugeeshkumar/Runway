package com.runway.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class AnalyticsInsightsDto {

    private String period;
    private String granularity;
    private String currency;
    private boolean hasEnoughData;

    private AnalyticsOverviewDto overview;
    private List<TimeTrendPointDto> spendingOverTime;
    private List<CategoryAnalysisDto> categoryAnalysis;
    private List<String> spendingPatterns;
    private BudgetRelationshipDto budgetRelationship;

    public AnalyticsInsightsDto() {}

    public AnalyticsInsightsDto(String period, String granularity, String currency, boolean hasEnoughData, AnalyticsOverviewDto overview, List<TimeTrendPointDto> spendingOverTime, List<CategoryAnalysisDto> categoryAnalysis, List<String> spendingPatterns, BudgetRelationshipDto budgetRelationship) {
        this.period = period;
        this.granularity = granularity;
        this.currency = currency;
        this.hasEnoughData = hasEnoughData;
        this.overview = overview;
        this.spendingOverTime = spendingOverTime;
        this.categoryAnalysis = categoryAnalysis;
        this.spendingPatterns = spendingPatterns;
        this.budgetRelationship = budgetRelationship;
    }

    public static AnalyticsInsightsDtoBuilder builder() {
        return new AnalyticsInsightsDtoBuilder();
    }

    public static class AnalyticsInsightsDtoBuilder {
        private String period;
        private String granularity;
        private String currency;
        private boolean hasEnoughData;
        private AnalyticsOverviewDto overview;
        private List<TimeTrendPointDto> spendingOverTime;
        private List<CategoryAnalysisDto> categoryAnalysis;
        private List<String> spendingPatterns;
        private BudgetRelationshipDto budgetRelationship;

        public AnalyticsInsightsDtoBuilder period(String period) { this.period = period; return this; }
        public AnalyticsInsightsDtoBuilder granularity(String granularity) { this.granularity = granularity; return this; }
        public AnalyticsInsightsDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public AnalyticsInsightsDtoBuilder hasEnoughData(boolean hasEnoughData) { this.hasEnoughData = hasEnoughData; return this; }
        public AnalyticsInsightsDtoBuilder overview(AnalyticsOverviewDto overview) { this.overview = overview; return this; }
        public AnalyticsInsightsDtoBuilder spendingOverTime(List<TimeTrendPointDto> spendingOverTime) { this.spendingOverTime = spendingOverTime; return this; }
        public AnalyticsInsightsDtoBuilder categoryAnalysis(List<CategoryAnalysisDto> categoryAnalysis) { this.categoryAnalysis = categoryAnalysis; return this; }
        public AnalyticsInsightsDtoBuilder spendingPatterns(List<String> spendingPatterns) { this.spendingPatterns = spendingPatterns; return this; }
        public AnalyticsInsightsDtoBuilder budgetRelationship(BudgetRelationshipDto budgetRelationship) { this.budgetRelationship = budgetRelationship; return this; }

        public AnalyticsInsightsDto build() {
            return new AnalyticsInsightsDto(period, granularity, currency, hasEnoughData, overview, spendingOverTime, categoryAnalysis, spendingPatterns, budgetRelationship);
        }
    }

    // Getters & Setters
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getGranularity() { return granularity; }
    public void setGranularity(String granularity) { this.granularity = granularity; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public boolean isHasEnoughData() { return hasEnoughData; }
    public void setHasEnoughData(boolean hasEnoughData) { this.hasEnoughData = hasEnoughData; }

    public AnalyticsOverviewDto getOverview() { return overview; }
    public void setOverview(AnalyticsOverviewDto overview) { this.overview = overview; }

    public List<TimeTrendPointDto> getSpendingOverTime() { return spendingOverTime; }
    public void setSpendingOverTime(List<TimeTrendPointDto> spendingOverTime) { this.spendingOverTime = spendingOverTime; }

    public List<CategoryAnalysisDto> getCategoryAnalysis() { return categoryAnalysis; }
    public void setCategoryAnalysis(List<CategoryAnalysisDto> categoryAnalysis) { this.categoryAnalysis = categoryAnalysis; }

    public List<String> getSpendingPatterns() { return spendingPatterns; }
    public void setSpendingPatterns(List<String> spendingPatterns) { this.spendingPatterns = spendingPatterns; }

    public BudgetRelationshipDto getBudgetRelationship() { return budgetRelationship; }
    public void setBudgetRelationship(BudgetRelationshipDto budgetRelationship) { this.budgetRelationship = budgetRelationship; }

    // Nested DTO classes
    public static class AnalyticsOverviewDto {
        private BigDecimal totalSpent;
        private BigDecimal averageDailySpent;
        private long totalTransactions;
        private BigDecimal largestExpenseAmount;
        private String largestExpenseDescription;
        private String largestExpenseMerchant;
        private String largestExpenseDate;
        private BigDecimal previousPeriodSpent;
        private double periodDeltaPercentage;

        public AnalyticsOverviewDto() {}

        public AnalyticsOverviewDto(BigDecimal totalSpent, BigDecimal averageDailySpent, long totalTransactions, BigDecimal largestExpenseAmount, String largestExpenseDescription, String largestExpenseMerchant, String largestExpenseDate, BigDecimal previousPeriodSpent, double periodDeltaPercentage) {
            this.totalSpent = totalSpent;
            this.averageDailySpent = averageDailySpent;
            this.totalTransactions = totalTransactions;
            this.largestExpenseAmount = largestExpenseAmount;
            this.largestExpenseDescription = largestExpenseDescription;
            this.largestExpenseMerchant = largestExpenseMerchant;
            this.largestExpenseDate = largestExpenseDate;
            this.previousPeriodSpent = previousPeriodSpent;
            this.periodDeltaPercentage = periodDeltaPercentage;
        }

        public BigDecimal getTotalSpent() { return totalSpent; }
        public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

        public BigDecimal getAverageDailySpent() { return averageDailySpent; }
        public void setAverageDailySpent(BigDecimal averageDailySpent) { this.averageDailySpent = averageDailySpent; }

        public long getTotalTransactions() { return totalTransactions; }
        public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

        public BigDecimal getLargestExpenseAmount() { return largestExpenseAmount; }
        public void setLargestExpenseAmount(BigDecimal largestExpenseAmount) { this.largestExpenseAmount = largestExpenseAmount; }

        public String getLargestExpenseDescription() { return largestExpenseDescription; }
        public void setLargestExpenseDescription(String largestExpenseDescription) { this.largestExpenseDescription = largestExpenseDescription; }

        public String getLargestExpenseMerchant() { return largestExpenseMerchant; }
        public void setLargestExpenseMerchant(String largestExpenseMerchant) { this.largestExpenseMerchant = largestExpenseMerchant; }

        public String getLargestExpenseDate() { return largestExpenseDate; }
        public void setLargestExpenseDate(String largestExpenseDate) { this.largestExpenseDate = largestExpenseDate; }

        public BigDecimal getPreviousPeriodSpent() { return previousPeriodSpent; }
        public void setPreviousPeriodSpent(BigDecimal previousPeriodSpent) { this.previousPeriodSpent = previousPeriodSpent; }

        public double getPeriodDeltaPercentage() { return periodDeltaPercentage; }
        public void setPeriodDeltaPercentage(double periodDeltaPercentage) { this.periodDeltaPercentage = periodDeltaPercentage; }
    }

    public static class TimeTrendPointDto {
        private String periodLabel;
        private String startDate;
        private String endDate;
        private BigDecimal totalAmount;
        private long transactionCount;

        public TimeTrendPointDto() {}

        public TimeTrendPointDto(String periodLabel, String startDate, String endDate, BigDecimal totalAmount, long transactionCount) {
            this.periodLabel = periodLabel;
            this.startDate = startDate;
            this.endDate = endDate;
            this.totalAmount = totalAmount;
            this.transactionCount = transactionCount;
        }

        public String getPeriodLabel() { return periodLabel; }
        public void setPeriodLabel(String periodLabel) { this.periodLabel = periodLabel; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public long getTransactionCount() { return transactionCount; }
        public void setTransactionCount(long transactionCount) { this.transactionCount = transactionCount; }
    }

    public static class CategoryAnalysisDto {
        private UUID categoryId;
        private String categoryName;
        private String color;
        private BigDecimal totalAmount;
        private double percentage;
        private long transactionCount;

        public CategoryAnalysisDto() {}

        public CategoryAnalysisDto(UUID categoryId, String categoryName, String color, BigDecimal totalAmount, double percentage, long transactionCount) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.color = color;
            this.totalAmount = totalAmount;
            this.percentage = percentage;
            this.transactionCount = transactionCount;
        }

        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }

        public long getTransactionCount() { return transactionCount; }
        public void setTransactionCount(long transactionCount) { this.transactionCount = transactionCount; }
    }

    public static class BudgetRelationshipDto {
        private BigDecimal overallBudget;
        private BigDecimal totalSpent;
        private BigDecimal remainingBudget;
        private double percentageUsed;
        private BigDecimal projectedEomTotal;
        private boolean isProjectionAvailable;
        private String projectionNotice;

        public BudgetRelationshipDto() {}

        public BudgetRelationshipDto(BigDecimal overallBudget, BigDecimal totalSpent, BigDecimal remainingBudget, double percentageUsed, BigDecimal projectedEomTotal, boolean isProjectionAvailable, String projectionNotice) {
            this.overallBudget = overallBudget;
            this.totalSpent = totalSpent;
            this.remainingBudget = remainingBudget;
            this.percentageUsed = percentageUsed;
            this.projectedEomTotal = projectedEomTotal;
            this.isProjectionAvailable = isProjectionAvailable;
            this.projectionNotice = projectionNotice;
        }

        public BigDecimal getOverallBudget() { return overallBudget; }
        public void setOverallBudget(BigDecimal overallBudget) { this.overallBudget = overallBudget; }

        public BigDecimal getTotalSpent() { return totalSpent; }
        public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

        public BigDecimal getRemainingBudget() { return remainingBudget; }
        public void setRemainingBudget(BigDecimal remainingBudget) { this.remainingBudget = remainingBudget; }

        public double getPercentageUsed() { return percentageUsed; }
        public void setPercentageUsed(double percentageUsed) { this.percentageUsed = percentageUsed; }

        public BigDecimal getProjectedEomTotal() { return projectedEomTotal; }
        public void setProjectedEomTotal(BigDecimal projectedEomTotal) { this.projectedEomTotal = projectedEomTotal; }

        public boolean isIsProjectionAvailable() { return isProjectionAvailable; }
        public void setIsProjectionAvailable(boolean isProjectionAvailable) { this.isProjectionAvailable = isProjectionAvailable; }

        public String getProjectionNotice() { return projectionNotice; }
        public void setProjectionNotice(String projectionNotice) { this.projectionNotice = projectionNotice; }
    }
}

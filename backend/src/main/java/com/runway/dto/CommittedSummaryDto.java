package com.runway.dto;

import java.math.BigDecimal;

public class CommittedSummaryDto {

    private BigDecimal totalMonthlyCommitted;
    private BigDecimal monthlyIncome;
    private Double incomeCommittedPercentage;
    private int activeTemplatesCount;
    private String currency;

    public CommittedSummaryDto() {}

    public CommittedSummaryDto(BigDecimal totalMonthlyCommitted, BigDecimal monthlyIncome, Double incomeCommittedPercentage, int activeTemplatesCount, String currency) {
        this.totalMonthlyCommitted = totalMonthlyCommitted;
        this.monthlyIncome = monthlyIncome;
        this.incomeCommittedPercentage = incomeCommittedPercentage;
        this.activeTemplatesCount = activeTemplatesCount;
        this.currency = currency;
    }

    public BigDecimal getTotalMonthlyCommitted() { return totalMonthlyCommitted; }
    public void setTotalMonthlyCommitted(BigDecimal totalMonthlyCommitted) { this.totalMonthlyCommitted = totalMonthlyCommitted; }

    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }

    public Double getIncomeCommittedPercentage() { return incomeCommittedPercentage; }
    public void setIncomeCommittedPercentage(Double incomeCommittedPercentage) { this.incomeCommittedPercentage = incomeCommittedPercentage; }

    public int getActiveTemplatesCount() { return activeTemplatesCount; }
    public void setActiveTemplatesCount(int activeTemplatesCount) { this.activeTemplatesCount = activeTemplatesCount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

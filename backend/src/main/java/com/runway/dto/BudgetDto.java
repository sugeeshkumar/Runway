package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class BudgetDto {
    private UUID id;
    private UUID userId;
    private CategoryDto category;
    private String periodMonth;
    private BigDecimal amount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private BudgetStatus status;

    public BudgetDto() {}

    public BudgetDto(UUID id, UUID userId, CategoryDto category, String periodMonth, BigDecimal amount, BigDecimal spentAmount, BigDecimal remainingAmount, BudgetStatus status) {
        this.id = id;
        this.userId = userId;
        this.category = category;
        this.periodMonth = periodMonth;
        this.amount = amount;
        this.spentAmount = spentAmount;
        this.remainingAmount = remainingAmount;
        this.status = status;
    }

    public static BudgetDtoBuilder builder() {
        return new BudgetDtoBuilder();
    }

    public static class BudgetDtoBuilder {
        private UUID id;
        private UUID userId;
        private CategoryDto category;
        private String periodMonth;
        private BigDecimal amount;
        private BigDecimal spentAmount;
        private BigDecimal remainingAmount;
        private BudgetStatus status;

        public BudgetDtoBuilder id(UUID id) { this.id = id; return this; }
        public BudgetDtoBuilder userId(UUID userId) { this.userId = userId; return this; }
        public BudgetDtoBuilder category(CategoryDto category) { this.category = category; return this; }
        public BudgetDtoBuilder periodMonth(String periodMonth) { this.periodMonth = periodMonth; return this; }
        public BudgetDtoBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public BudgetDtoBuilder spentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; return this; }
        public BudgetDtoBuilder remainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; return this; }
        public BudgetDtoBuilder status(BudgetStatus status) { this.status = status; return this; }

        public BudgetDto build() {
            return new BudgetDto(id, userId, category, periodMonth, amount, spentAmount, remainingAmount, status);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public CategoryDto getCategory() { return category; }
    public void setCategory(CategoryDto category) { this.category = category; }

    public String getPeriodMonth() { return periodMonth; }
    public void setPeriodMonth(String periodMonth) { this.periodMonth = periodMonth; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getSpentAmount() { return spentAmount; }
    public void setSpentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; }

    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }

    public BudgetStatus getStatus() { return status; }
    public void setStatus(BudgetStatus status) { this.status = status; }
}

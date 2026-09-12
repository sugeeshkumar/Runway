package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CategoryTrendDto {
    private String periodMonth; // YYYY-MM
    private UUID categoryId;
    private String categoryName;
    private String color;
    private BigDecimal spentAmount;

    public CategoryTrendDto() {}

    public CategoryTrendDto(String periodMonth, UUID categoryId, String categoryName, String color, BigDecimal spentAmount) {
        this.periodMonth = periodMonth;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.color = color;
        this.spentAmount = spentAmount;
    }

    public String getPeriodMonth() { return periodMonth; }
    public void setPeriodMonth(String periodMonth) { this.periodMonth = periodMonth; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public BigDecimal getSpentAmount() { return spentAmount; }
    public void setSpentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; }

    public static CategoryTrendDtoBuilder builder() { return new CategoryTrendDtoBuilder(); }

    public static class CategoryTrendDtoBuilder {
        private String periodMonth;
        private UUID categoryId;
        private String categoryName;
        private String color;
        private BigDecimal spentAmount;

        public CategoryTrendDtoBuilder periodMonth(String periodMonth) { this.periodMonth = periodMonth; return this; }
        public CategoryTrendDtoBuilder categoryId(UUID categoryId) { this.categoryId = categoryId; return this; }
        public CategoryTrendDtoBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public CategoryTrendDtoBuilder color(String color) { this.color = color; return this; }
        public CategoryTrendDtoBuilder spentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; return this; }

        public CategoryTrendDto build() {
            return new CategoryTrendDto(periodMonth, categoryId, categoryName, color, spentAmount);
        }
    }
}

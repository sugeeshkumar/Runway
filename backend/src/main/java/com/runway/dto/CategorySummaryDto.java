package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CategorySummaryDto {
    private UUID categoryId;
    private String categoryName;
    private String color;
    private BigDecimal spentAmount;
    private double percentage;

    public CategorySummaryDto() {}

    public CategorySummaryDto(UUID categoryId, String categoryName, String color, BigDecimal spentAmount, double percentage) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.color = color;
        this.spentAmount = spentAmount;
        this.percentage = percentage;
    }

    public static CategorySummaryDtoBuilder builder() {
        return new CategorySummaryDtoBuilder();
    }

    public static class CategorySummaryDtoBuilder {
        private UUID categoryId;
        private String categoryName;
        private String color;
        private BigDecimal spentAmount;
        private double percentage;

        public CategorySummaryDtoBuilder categoryId(UUID categoryId) { this.categoryId = categoryId; return this; }
        public CategorySummaryDtoBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public CategorySummaryDtoBuilder color(String color) { this.color = color; return this; }
        public CategorySummaryDtoBuilder spentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; return this; }
        public CategorySummaryDtoBuilder percentage(double percentage) { this.percentage = percentage; return this; }

        public CategorySummaryDto build() {
            return new CategorySummaryDto(categoryId, categoryName, color, spentAmount, percentage);
        }
    }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public BigDecimal getSpentAmount() { return spentAmount; }
    public void setSpentAmount(BigDecimal spentAmount) { this.spentAmount = spentAmount; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }
}

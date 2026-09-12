package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CategoryDeltaDto {
    private UUID categoryId;
    private String categoryName;
    private String color;
    private BigDecimal currentSpent;
    private BigDecimal previousSpent;
    private BigDecimal deltaAmount;
    private double deltaPercentage;

    public CategoryDeltaDto() {}

    public CategoryDeltaDto(UUID categoryId, String categoryName, String color, BigDecimal currentSpent, BigDecimal previousSpent, BigDecimal deltaAmount, double deltaPercentage) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.color = color;
        this.currentSpent = currentSpent;
        this.previousSpent = previousSpent;
        this.deltaAmount = deltaAmount;
        this.deltaPercentage = deltaPercentage;
    }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public BigDecimal getCurrentSpent() { return currentSpent; }
    public void setCurrentSpent(BigDecimal currentSpent) { this.currentSpent = currentSpent; }

    public BigDecimal getPreviousSpent() { return previousSpent; }
    public void setPreviousSpent(BigDecimal previousSpent) { this.previousSpent = previousSpent; }

    public BigDecimal getDeltaAmount() { return deltaAmount; }
    public void setDeltaAmount(BigDecimal deltaAmount) { this.deltaAmount = deltaAmount; }

    public double getDeltaPercentage() { return deltaPercentage; }
    public void setDeltaPercentage(double deltaPercentage) { this.deltaPercentage = deltaPercentage; }

    public static CategoryDeltaDtoBuilder builder() { return new CategoryDeltaDtoBuilder(); }

    public static class CategoryDeltaDtoBuilder {
        private UUID categoryId;
        private String categoryName;
        private String color;
        private BigDecimal currentSpent;
        private BigDecimal previousSpent;
        private BigDecimal deltaAmount;
        private double deltaPercentage;

        public CategoryDeltaDtoBuilder categoryId(UUID categoryId) { this.categoryId = categoryId; return this; }
        public CategoryDeltaDtoBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public CategoryDeltaDtoBuilder color(String color) { this.color = color; return this; }
        public CategoryDeltaDtoBuilder currentSpent(BigDecimal currentSpent) { this.currentSpent = currentSpent; return this; }
        public CategoryDeltaDtoBuilder previousSpent(BigDecimal previousSpent) { this.previousSpent = previousSpent; return this; }
        public CategoryDeltaDtoBuilder deltaAmount(BigDecimal deltaAmount) { this.deltaAmount = deltaAmount; return this; }
        public CategoryDeltaDtoBuilder deltaPercentage(double deltaPercentage) { this.deltaPercentage = deltaPercentage; return this; }

        public CategoryDeltaDto build() {
            return new CategoryDeltaDto(categoryId, categoryName, color, currentSpent, previousSpent, deltaAmount, deltaPercentage);
        }
    }
}

package com.runway.dto;

import java.math.BigDecimal;

public class DayOfWeekSpendDto {
    private int dayOfWeek; // 1 = Monday, 7 = Sunday
    private String dayName; // "Monday", "Tuesday", etc.
    private BigDecimal totalSpent;
    private long transactionCount;
    private double intensityPercentage;

    public DayOfWeekSpendDto() {}

    public DayOfWeekSpendDto(int dayOfWeek, String dayName, BigDecimal totalSpent, long transactionCount, double intensityPercentage) {
        this.dayOfWeek = dayOfWeek;
        this.dayName = dayName;
        this.totalSpent = totalSpent;
        this.transactionCount = transactionCount;
        this.intensityPercentage = intensityPercentage;
    }

    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getDayName() { return dayName; }
    public void setDayName(String dayName) { this.dayName = dayName; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(long transactionCount) { this.transactionCount = transactionCount; }

    public double getIntensityPercentage() { return intensityPercentage; }
    public void setIntensityPercentage(double intensityPercentage) { this.intensityPercentage = intensityPercentage; }

    public static DayOfWeekSpendDtoBuilder builder() { return new DayOfWeekSpendDtoBuilder(); }

    public static class DayOfWeekSpendDtoBuilder {
        private int dayOfWeek;
        private String dayName;
        private BigDecimal totalSpent;
        private long transactionCount;
        private double intensityPercentage;

        public DayOfWeekSpendDtoBuilder dayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; return this; }
        public DayOfWeekSpendDtoBuilder dayName(String dayName) { this.dayName = dayName; return this; }
        public DayOfWeekSpendDtoBuilder totalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; return this; }
        public DayOfWeekSpendDtoBuilder transactionCount(long transactionCount) { this.transactionCount = transactionCount; return this; }
        public DayOfWeekSpendDtoBuilder intensityPercentage(double intensityPercentage) { this.intensityPercentage = intensityPercentage; return this; }

        public DayOfWeekSpendDto build() {
            return new DayOfWeekSpendDto(dayOfWeek, dayName, totalSpent, transactionCount, intensityPercentage);
        }
    }
}

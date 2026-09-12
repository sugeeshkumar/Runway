package com.runway.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class SavingsGoalDto {
    private UUID id;
    private UUID userId;
    private String name;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private String currency;
    private BigDecimal currentSaved;
    private double percentage;
    private LocalDate estimatedCompletionDate;
    private int contributionsCount;
    private Instant createdAt;
    private List<GoalContributionDto> contributions;

    public SavingsGoalDto() {}

    public SavingsGoalDto(UUID id, UUID userId, String name, BigDecimal targetAmount, LocalDate targetDate, String currency, BigDecimal currentSaved, double percentage, LocalDate estimatedCompletionDate, int contributionsCount, Instant createdAt, List<GoalContributionDto> contributions) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.targetAmount = targetAmount;
        this.targetDate = targetDate;
        this.currency = currency;
        this.currentSaved = currentSaved;
        this.percentage = percentage;
        this.estimatedCompletionDate = estimatedCompletionDate;
        this.contributionsCount = contributionsCount;
        this.createdAt = createdAt;
        this.contributions = contributions;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getTargetAmount() { return targetAmount; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getCurrentSaved() { return currentSaved; }
    public void setCurrentSaved(BigDecimal currentSaved) { this.currentSaved = currentSaved; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public LocalDate getEstimatedCompletionDate() { return estimatedCompletionDate; }
    public void setEstimatedCompletionDate(LocalDate estimatedCompletionDate) { this.estimatedCompletionDate = estimatedCompletionDate; }

    public int getContributionsCount() { return contributionsCount; }
    public void setContributionsCount(int contributionsCount) { this.contributionsCount = contributionsCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<GoalContributionDto> getContributions() { return contributions; }
    public void setContributions(List<GoalContributionDto> contributions) { this.contributions = contributions; }

    public static SavingsGoalDtoBuilder builder() {
        return new SavingsGoalDtoBuilder();
    }

    public static class SavingsGoalDtoBuilder {
        private UUID id;
        private UUID userId;
        private String name;
        private BigDecimal targetAmount;
        private LocalDate targetDate;
        private String currency;
        private BigDecimal currentSaved;
        private double percentage;
        private LocalDate estimatedCompletionDate;
        private int contributionsCount;
        private Instant createdAt;
        private List<GoalContributionDto> contributions;

        public SavingsGoalDtoBuilder id(UUID id) { this.id = id; return this; }
        public SavingsGoalDtoBuilder userId(UUID userId) { this.userId = userId; return this; }
        public SavingsGoalDtoBuilder name(String name) { this.name = name; return this; }
        public SavingsGoalDtoBuilder targetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; return this; }
        public SavingsGoalDtoBuilder targetDate(LocalDate targetDate) { this.targetDate = targetDate; return this; }
        public SavingsGoalDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public SavingsGoalDtoBuilder currentSaved(BigDecimal currentSaved) { this.currentSaved = currentSaved; return this; }
        public SavingsGoalDtoBuilder percentage(double percentage) { this.percentage = percentage; return this; }
        public SavingsGoalDtoBuilder estimatedCompletionDate(LocalDate estimatedCompletionDate) { this.estimatedCompletionDate = estimatedCompletionDate; return this; }
        public SavingsGoalDtoBuilder contributionsCount(int contributionsCount) { this.contributionsCount = contributionsCount; return this; }
        public SavingsGoalDtoBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public SavingsGoalDtoBuilder contributions(List<GoalContributionDto> contributions) { this.contributions = contributions; return this; }

        public SavingsGoalDto build() {
            return new SavingsGoalDto(id, userId, name, targetAmount, targetDate, currency, currentSaved, percentage, estimatedCompletionDate, contributionsCount, createdAt, contributions);
        }
    }
}

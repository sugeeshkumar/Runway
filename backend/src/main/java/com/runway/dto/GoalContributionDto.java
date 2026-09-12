package com.runway.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class GoalContributionDto {
    private UUID id;
    private UUID goalId;
    private BigDecimal amount;
    private Instant occurredAt;
    private String note;
    private Instant createdAt;

    public GoalContributionDto() {}

    public GoalContributionDto(UUID id, UUID goalId, BigDecimal amount, Instant occurredAt, String note, Instant createdAt) {
        this.id = id;
        this.goalId = goalId;
        this.amount = amount;
        this.occurredAt = occurredAt;
        this.note = note;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static GoalContributionDtoBuilder builder() {
        return new GoalContributionDtoBuilder();
    }

    public static class GoalContributionDtoBuilder {
        private UUID id;
        private UUID goalId;
        private BigDecimal amount;
        private Instant occurredAt;
        private String note;
        private Instant createdAt;

        public GoalContributionDtoBuilder id(UUID id) { this.id = id; return this; }
        public GoalContributionDtoBuilder goalId(UUID goalId) { this.goalId = goalId; return this; }
        public GoalContributionDtoBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public GoalContributionDtoBuilder occurredAt(Instant occurredAt) { this.occurredAt = occurredAt; return this; }
        public GoalContributionDtoBuilder note(String note) { this.note = note; return this; }
        public GoalContributionDtoBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public GoalContributionDto build() {
            return new GoalContributionDto(id, goalId, amount, occurredAt, note, createdAt);
        }
    }
}

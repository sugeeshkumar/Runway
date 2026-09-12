package com.runway.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "goal_contributions")
public class GoalContribution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private SavingsGoal goal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public GoalContribution() {}

    public GoalContribution(UUID id, SavingsGoal goal, BigDecimal amount, Instant occurredAt, String note, Instant createdAt) {
        this.id = id;
        this.goal = goal;
        this.amount = amount;
        this.occurredAt = occurredAt;
        this.note = note;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SavingsGoal getGoal() { return goal; }
    public void setGoal(SavingsGoal goal) { this.goal = goal; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public static GoalContributionBuilder builder() {
        return new GoalContributionBuilder();
    }

    public static class GoalContributionBuilder {
        private UUID id;
        private SavingsGoal goal;
        private BigDecimal amount;
        private Instant occurredAt;
        private String note;
        private Instant createdAt;

        public GoalContributionBuilder id(UUID id) { this.id = id; return this; }
        public GoalContributionBuilder goal(SavingsGoal goal) { this.goal = goal; return this; }
        public GoalContributionBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public GoalContributionBuilder occurredAt(Instant occurredAt) { this.occurredAt = occurredAt; return this; }
        public GoalContributionBuilder note(String note) { this.note = note; return this; }
        public GoalContributionBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public GoalContribution build() {
            return new GoalContribution(id, goal, amount, occurredAt, note, createdAt);
        }
    }
}

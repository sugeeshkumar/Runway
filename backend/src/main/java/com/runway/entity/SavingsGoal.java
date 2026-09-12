package com.runway.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "savings_goals")
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalContribution> contributions = new ArrayList<>();

    public SavingsGoal() {}

    public SavingsGoal(UUID id, User user, String name, BigDecimal targetAmount, LocalDate targetDate, String currency, Instant createdAt, List<GoalContribution> contributions) {
        this.id = id;
        this.user = user;
        this.name = name;
        this.targetAmount = targetAmount;
        this.targetDate = targetDate;
        this.currency = currency != null ? currency : "INR";
        this.createdAt = createdAt;
        if (contributions != null) {
            this.contributions = contributions;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getTargetAmount() { return targetAmount; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<GoalContribution> getContributions() { return contributions; }
    public void setContributions(List<GoalContribution> contributions) { this.contributions = contributions; }

    public static SavingsGoalBuilder builder() {
        return new SavingsGoalBuilder();
    }

    public static class SavingsGoalBuilder {
        private UUID id;
        private User user;
        private String name;
        private BigDecimal targetAmount;
        private LocalDate targetDate;
        private String currency = "INR";
        private Instant createdAt;
        private List<GoalContribution> contributions = new ArrayList<>();

        public SavingsGoalBuilder id(UUID id) { this.id = id; return this; }
        public SavingsGoalBuilder user(User user) { this.user = user; return this; }
        public SavingsGoalBuilder name(String name) { this.name = name; return this; }
        public SavingsGoalBuilder targetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; return this; }
        public SavingsGoalBuilder targetDate(LocalDate targetDate) { this.targetDate = targetDate; return this; }
        public SavingsGoalBuilder currency(String currency) { this.currency = currency; return this; }
        public SavingsGoalBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public SavingsGoalBuilder contributions(List<GoalContribution> contributions) { this.contributions = contributions; return this; }

        public SavingsGoal build() {
            return new SavingsGoal(id, user, name, targetAmount, targetDate, currency, createdAt, contributions);
        }
    }
}

package com.runway.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "period_month", nullable = false, length = 7)
    private String periodMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Budget() {}

    public Budget(UUID id, User user, Category category, String periodMonth, BigDecimal amount, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.category = category;
        this.periodMonth = periodMonth;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public static BudgetBuilder builder() {
        return new BudgetBuilder();
    }

    public static class BudgetBuilder {
        private UUID id;
        private User user;
        private Category category;
        private String periodMonth;
        private BigDecimal amount;
        private Instant createdAt;

        public BudgetBuilder id(UUID id) { this.id = id; return this; }
        public BudgetBuilder user(User user) { this.user = user; return this; }
        public BudgetBuilder category(Category category) { this.category = category; return this; }
        public BudgetBuilder periodMonth(String periodMonth) { this.periodMonth = periodMonth; return this; }
        public BudgetBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public BudgetBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Budget build() {
            return new Budget(id, user, category, periodMonth, amount, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getPeriodMonth() { return periodMonth; }
    public void setPeriodMonth(String periodMonth) { this.periodMonth = periodMonth; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

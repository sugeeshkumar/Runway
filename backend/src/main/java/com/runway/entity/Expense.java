package com.runway.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(length = 255)
    private String merchant;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseSource source;

    @Column(name = "raw_input", columnDefinition = "TEXT")
    private String rawInput;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Expense() {}

    public Expense(UUID id, User user, BigDecimal amount, String currency, Category category, String merchant, String description, Instant occurredAt, ExpenseSource source, String rawInput, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.amount = amount;
        this.currency = currency;
        this.category = category;
        this.merchant = merchant;
        this.description = description;
        this.occurredAt = occurredAt;
        this.source = source;
        this.rawInput = rawInput;
        this.createdAt = createdAt;
    }

    public static ExpenseBuilder builder() {
        return new ExpenseBuilder();
    }

    public static class ExpenseBuilder {
        private UUID id;
        private User user;
        private BigDecimal amount;
        private String currency;
        private Category category;
        private String merchant;
        private String description;
        private Instant occurredAt;
        private ExpenseSource source;
        private String rawInput;
        private Instant createdAt;

        public ExpenseBuilder id(UUID id) { this.id = id; return this; }
        public ExpenseBuilder user(User user) { this.user = user; return this; }
        public ExpenseBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public ExpenseBuilder currency(String currency) { this.currency = currency; return this; }
        public ExpenseBuilder category(Category category) { this.category = category; return this; }
        public ExpenseBuilder merchant(String merchant) { this.merchant = merchant; return this; }
        public ExpenseBuilder description(String description) { this.description = description; return this; }
        public ExpenseBuilder occurredAt(Instant occurredAt) { this.occurredAt = occurredAt; return this; }
        public ExpenseBuilder source(ExpenseSource source) { this.source = source; return this; }
        public ExpenseBuilder rawInput(String rawInput) { this.rawInput = rawInput; return this; }
        public ExpenseBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Expense build() {
            return new Expense(id, user, amount, currency, category, merchant, description, occurredAt, source, rawInput, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public ExpenseSource getSource() { return source; }
    public void setSource(ExpenseSource source) { this.source = source; }

    public String getRawInput() { return rawInput; }
    public void setRawInput(String rawInput) { this.rawInput = rawInput; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

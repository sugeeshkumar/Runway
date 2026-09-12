package com.runway.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "recurring_expense_templates")
public class RecurringExpenseTemplate {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Cadence cadence;

    @Column(name = "next_due_date", nullable = false)
    private LocalDate nextDueDate;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "is_paused", nullable = false)
    private boolean isPaused = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public RecurringExpenseTemplate() {}

    public RecurringExpenseTemplate(UUID id, User user, BigDecimal amount, String currency, Category category, Cadence cadence, LocalDate nextDueDate, String description, boolean isPaused, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.amount = amount;
        this.currency = currency;
        this.category = category;
        this.cadence = cadence;
        this.nextDueDate = nextDueDate;
        this.description = description;
        this.isPaused = isPaused;
        this.createdAt = createdAt;
    }

    public static RecurringExpenseTemplateBuilder builder() {
        return new RecurringExpenseTemplateBuilder();
    }

    public static class RecurringExpenseTemplateBuilder {
        private UUID id;
        private User user;
        private BigDecimal amount;
        private String currency;
        private Category category;
        private Cadence cadence;
        private LocalDate nextDueDate;
        private String description;
        private boolean isPaused = false;
        private Instant createdAt;

        public RecurringExpenseTemplateBuilder id(UUID id) { this.id = id; return this; }
        public RecurringExpenseTemplateBuilder user(User user) { this.user = user; return this; }
        public RecurringExpenseTemplateBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public RecurringExpenseTemplateBuilder currency(String currency) { this.currency = currency; return this; }
        public RecurringExpenseTemplateBuilder category(Category category) { this.category = category; return this; }
        public RecurringExpenseTemplateBuilder cadence(Cadence cadence) { this.cadence = cadence; return this; }
        public RecurringExpenseTemplateBuilder nextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; return this; }
        public RecurringExpenseTemplateBuilder description(String description) { this.description = description; return this; }
        public RecurringExpenseTemplateBuilder isPaused(boolean isPaused) { this.isPaused = isPaused; return this; }
        public RecurringExpenseTemplateBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public RecurringExpenseTemplate build() {
            return new RecurringExpenseTemplate(id, user, amount, currency, category, cadence, nextDueDate, description, isPaused, createdAt);
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

    public Cadence getCadence() { return cadence; }
    public void setCadence(Cadence cadence) { this.cadence = cadence; }

    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isPaused() { return isPaused; }
    public void setPaused(boolean paused) { isPaused = paused; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

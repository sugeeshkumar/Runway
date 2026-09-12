package com.runway.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "generated_recurring_charges")
public class GeneratedRecurringCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private RecurringExpenseTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @Column(name = "charge_date", nullable = false)
    private LocalDate chargeDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public GeneratedRecurringCharge() {}

    public GeneratedRecurringCharge(RecurringExpenseTemplate template, Expense expense, LocalDate chargeDate) {
        this.template = template;
        this.expense = expense;
        this.chargeDate = chargeDate;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public RecurringExpenseTemplate getTemplate() { return template; }
    public void setTemplate(RecurringExpenseTemplate template) { this.template = template; }

    public Expense getExpense() { return expense; }
    public void setExpense(Expense expense) { this.expense = expense; }

    public LocalDate getChargeDate() { return chargeDate; }
    public void setChargeDate(LocalDate chargeDate) { this.chargeDate = chargeDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

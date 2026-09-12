package com.runway.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shared_expenses")
public class SharedExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_id", nullable = false)
    private SharedLedger ledger;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paid_by_participant_id", nullable = false)
    private LedgerParticipant paidByParticipant;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "exchange_rate", nullable = false, precision = 10, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "base_currency_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseCurrencyAmount;

    @Column(nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_type", nullable = false)
    private SplitType splitType = SplitType.EQUAL;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "sharedExpense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SharedExpenseSplit> splits = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.occurredAt == null) {
            this.occurredAt = Instant.now();
        }
    }

    public SharedExpense() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SharedLedger getLedger() { return ledger; }
    public void setLedger(SharedLedger ledger) { this.ledger = ledger; }

    public LedgerParticipant getPaidByParticipant() { return paidByParticipant; }
    public void setPaidByParticipant(LedgerParticipant paidByParticipant) { this.paidByParticipant = paidByParticipant; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }

    public BigDecimal getBaseCurrencyAmount() { return baseCurrencyAmount; }
    public void setBaseCurrencyAmount(BigDecimal baseCurrencyAmount) { this.baseCurrencyAmount = baseCurrencyAmount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SplitType getSplitType() { return splitType; }
    public void setSplitType(SplitType splitType) { this.splitType = splitType; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<SharedExpenseSplit> getSplits() { return splits; }
    public void setSplits(List<SharedExpenseSplit> splits) { this.splits = splits; }
}

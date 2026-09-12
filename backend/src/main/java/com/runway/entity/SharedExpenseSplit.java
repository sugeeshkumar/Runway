package com.runway.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shared_expense_splits")
public class SharedExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_expense_id", nullable = false)
    private SharedExpense sharedExpense;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private LedgerParticipant participant;

    @Column(name = "share_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shareAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public SharedExpenseSplit() {}

    public SharedExpenseSplit(SharedExpense sharedExpense, LedgerParticipant participant, BigDecimal shareAmount) {
        this.sharedExpense = sharedExpense;
        this.participant = participant;
        this.shareAmount = shareAmount;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SharedExpense getSharedExpense() { return sharedExpense; }
    public void setSharedExpense(SharedExpense sharedExpense) { this.sharedExpense = sharedExpense; }

    public LedgerParticipant getParticipant() { return participant; }
    public void setParticipant(LedgerParticipant participant) { this.participant = participant; }

    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

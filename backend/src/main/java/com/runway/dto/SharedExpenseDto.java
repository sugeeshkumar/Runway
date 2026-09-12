package com.runway.dto;

import com.runway.entity.SplitType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SharedExpenseDto {

    private UUID id;
    private UUID ledgerId;
    private UUID paidByParticipantId;
    private String paidByParticipantName;
    private BigDecimal amount;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal baseCurrencyAmount;
    private String description;
    private SplitType splitType;
    private Instant occurredAt;
    private Instant createdAt;
    private List<SharedExpenseSplitDto> splits;

    public SharedExpenseDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLedgerId() { return ledgerId; }
    public void setLedgerId(UUID ledgerId) { this.ledgerId = ledgerId; }

    public UUID getPaidByParticipantId() { return paidByParticipantId; }
    public void setPaidByParticipantId(UUID paidByParticipantId) { this.paidByParticipantId = paidByParticipantId; }

    public String getPaidByParticipantName() { return paidByParticipantName; }
    public void setPaidByParticipantName(String paidByParticipantName) { this.paidByParticipantName = paidByParticipantName; }

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

    public List<SharedExpenseSplitDto> getSplits() { return splits; }
    public void setSplits(List<SharedExpenseSplitDto> splits) { this.splits = splits; }
}

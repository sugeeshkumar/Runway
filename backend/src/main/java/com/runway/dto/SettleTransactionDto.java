package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class SettleTransactionDto {

    private UUID fromParticipantId;
    private String fromParticipantName;
    private UUID toParticipantId;
    private String toParticipantName;
    private BigDecimal amount;
    private String currency;

    public SettleTransactionDto() {}

    public SettleTransactionDto(UUID fromParticipantId, String fromParticipantName, UUID toParticipantId, String toParticipantName, BigDecimal amount, String currency) {
        this.fromParticipantId = fromParticipantId;
        this.fromParticipantName = fromParticipantName;
        this.toParticipantId = toParticipantId;
        this.toParticipantName = toParticipantName;
        this.amount = amount;
        this.currency = currency;
    }

    public UUID getFromParticipantId() { return fromParticipantId; }
    public void setFromParticipantId(UUID fromParticipantId) { this.fromParticipantId = fromParticipantId; }

    public String getFromParticipantName() { return fromParticipantName; }
    public void setFromParticipantName(String fromParticipantName) { this.fromParticipantName = fromParticipantName; }

    public UUID getToParticipantId() { return toParticipantId; }
    public void setToParticipantId(UUID toParticipantId) { this.toParticipantId = toParticipantId; }

    public String getToParticipantName() { return toParticipantName; }
    public void setToParticipantName(String toParticipantName) { this.toParticipantName = toParticipantName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}

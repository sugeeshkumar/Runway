package com.runway.dto;

import com.runway.entity.SplitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CreateSharedExpenseRequest {

    @NotNull(message = "Paid by participant is required")
    private UUID paidByParticipantId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    private String currency = "INR";

    private BigDecimal exchangeRate = BigDecimal.ONE;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Split type is required")
    private SplitType splitType = SplitType.EQUAL;

    private Instant occurredAt;

    private List<SplitItemRequest> splits;

    public static class SplitItemRequest {
        private UUID participantId;
        private BigDecimal value; // Amount if EXACT, percentage if PERCENTAGE, ignored if EQUAL

        public SplitItemRequest() {}

        public SplitItemRequest(UUID participantId, BigDecimal value) {
            this.participantId = participantId;
            this.value = value;
        }

        public UUID getParticipantId() { return participantId; }
        public void setParticipantId(UUID participantId) { this.participantId = participantId; }

        public BigDecimal getValue() { return value; }
        public void setValue(BigDecimal value) { this.value = value; }
    }

    public CreateSharedExpenseRequest() {}

    public UUID getPaidByParticipantId() { return paidByParticipantId; }
    public void setPaidByParticipantId(UUID paidByParticipantId) { this.paidByParticipantId = paidByParticipantId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getExchangeRate() { return exchangeRate; }
    public void setExchangeRate(BigDecimal exchangeRate) { this.exchangeRate = exchangeRate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SplitType getSplitType() { return splitType; }
    public void setSplitType(SplitType splitType) { this.splitType = splitType; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public List<SplitItemRequest> getSplits() { return splits; }
    public void setSplits(List<SplitItemRequest> splits) { this.splits = splits; }
}

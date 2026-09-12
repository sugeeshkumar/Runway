package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class SharedExpenseSplitDto {

    private UUID id;
    private UUID participantId;
    private String participantName;
    private BigDecimal shareAmount;

    public SharedExpenseSplitDto() {}

    public SharedExpenseSplitDto(UUID id, UUID participantId, String participantName, BigDecimal shareAmount) {
        this.id = id;
        this.participantId = participantId;
        this.participantName = participantName;
        this.shareAmount = shareAmount;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }
}

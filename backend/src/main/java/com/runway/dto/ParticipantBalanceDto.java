package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ParticipantBalanceDto {

    private UUID participantId;
    private String participantName;
    private BigDecimal totalPaid;
    private BigDecimal totalOwed;
    private BigDecimal netBalance; // Paid minus Owed (positive = gets back, negative = owes)

    public ParticipantBalanceDto() {}

    public ParticipantBalanceDto(UUID participantId, String participantName, BigDecimal totalPaid, BigDecimal totalOwed, BigDecimal netBalance) {
        this.participantId = participantId;
        this.participantName = participantName;
        this.totalPaid = totalPaid;
        this.totalOwed = totalOwed;
        this.netBalance = netBalance;
    }

    public UUID getParticipantId() { return participantId; }
    public void setParticipantId(UUID participantId) { this.participantId = participantId; }

    public String getParticipantName() { return participantName; }
    public void setParticipantName(String participantName) { this.participantName = participantName; }

    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

    public BigDecimal getTotalOwed() { return totalOwed; }
    public void setTotalOwed(BigDecimal totalOwed) { this.totalOwed = totalOwed; }

    public BigDecimal getNetBalance() { return netBalance; }
    public void setNetBalance(BigDecimal netBalance) { this.netBalance = netBalance; }
}

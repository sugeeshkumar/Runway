package com.runway.dto;

import com.runway.entity.LedgerType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SharedLedgerDto {

    private UUID id;
    private UUID ownerId;
    private String ownerEmail;
    private String name;
    private LedgerType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private String baseCurrency;
    private BigDecimal plannedBudget;
    private BigDecimal totalSpentInBase;
    private boolean isSettled;
    private Instant settledAt;
    private Instant createdAt;
    private List<LedgerParticipantDto> participants;

    public SharedLedgerDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LedgerType getType() { return type; }
    public void setType(LedgerType type) { this.type = type; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }

    public BigDecimal getPlannedBudget() { return plannedBudget; }
    public void setPlannedBudget(BigDecimal plannedBudget) { this.plannedBudget = plannedBudget; }

    public BigDecimal getTotalSpentInBase() { return totalSpentInBase; }
    public void setTotalSpentInBase(BigDecimal totalSpentInBase) { this.totalSpentInBase = totalSpentInBase; }

    public boolean isSettled() { return isSettled; }
    public void setSettled(boolean settled) { isSettled = settled; }

    public Instant getSettledAt() { return settledAt; }
    public void setSettledAt(Instant settledAt) { this.settledAt = settledAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<LedgerParticipantDto> getParticipants() { return participants; }
    public void setParticipants(List<LedgerParticipantDto> participants) { this.participants = participants; }
}

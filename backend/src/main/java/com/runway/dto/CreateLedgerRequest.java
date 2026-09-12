package com.runway.dto;

import com.runway.entity.LedgerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CreateLedgerRequest {

    @NotBlank(message = "Ledger name is required")
    private String name;

    @NotNull(message = "Ledger type is required")
    private LedgerType type = LedgerType.TRIP;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private String baseCurrency = "INR";

    private BigDecimal plannedBudget;

    private List<String> participantNames;

    public CreateLedgerRequest() {}

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

    public List<String> getParticipantNames() { return participantNames; }
    public void setParticipantNames(List<String> participantNames) { this.participantNames = participantNames; }
}

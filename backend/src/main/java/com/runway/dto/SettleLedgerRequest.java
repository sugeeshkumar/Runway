package com.runway.dto;

import java.util.UUID;

public class SettleLedgerRequest {

    private boolean rollIntoPersonalHistory = false;
    private UUID personalCategoryId; // Optional category to tag personal reconciled expense under

    public SettleLedgerRequest() {}

    public SettleLedgerRequest(boolean rollIntoPersonalHistory, UUID personalCategoryId) {
        this.rollIntoPersonalHistory = rollIntoPersonalHistory;
        this.personalCategoryId = personalCategoryId;
    }

    public boolean isRollIntoPersonalHistory() { return rollIntoPersonalHistory; }
    public void setRollIntoPersonalHistory(boolean rollIntoPersonalHistory) { this.rollIntoPersonalHistory = rollIntoPersonalHistory; }

    public UUID getPersonalCategoryId() { return personalCategoryId; }
    public void setPersonalCategoryId(UUID personalCategoryId) { this.personalCategoryId = personalCategoryId; }
}

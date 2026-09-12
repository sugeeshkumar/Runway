package com.runway.dto;

import java.util.UUID;

public class LedgerParticipantDto {

    private UUID id;
    private UUID ledgerId;
    private String displayName;
    private UUID linkedUserId;
    private String linkedUserEmail;

    public LedgerParticipantDto() {}

    public LedgerParticipantDto(UUID id, UUID ledgerId, String displayName, UUID linkedUserId, String linkedUserEmail) {
        this.id = id;
        this.ledgerId = ledgerId;
        this.displayName = displayName;
        this.linkedUserId = linkedUserId;
        this.linkedUserEmail = linkedUserEmail;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLedgerId() { return ledgerId; }
    public void setLedgerId(UUID ledgerId) { this.ledgerId = ledgerId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public UUID getLinkedUserId() { return linkedUserId; }
    public void setLinkedUserId(UUID linkedUserId) { this.linkedUserId = linkedUserId; }

    public String getLinkedUserEmail() { return linkedUserEmail; }
    public void setLinkedUserEmail(String linkedUserEmail) { this.linkedUserEmail = linkedUserEmail; }
}

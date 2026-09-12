package com.runway.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class AddParticipantRequest {

    @NotBlank(message = "Display name is required")
    private String displayName;

    private UUID linkedUserId;

    public AddParticipantRequest() {}

    public AddParticipantRequest(String displayName, UUID linkedUserId) {
        this.displayName = displayName;
        this.linkedUserId = linkedUserId;
    }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public UUID getLinkedUserId() { return linkedUserId; }
    public void setLinkedUserId(UUID linkedUserId) { this.linkedUserId = linkedUserId; }
}

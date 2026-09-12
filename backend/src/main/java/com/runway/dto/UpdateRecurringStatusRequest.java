package com.runway.dto;

public class UpdateRecurringStatusRequest {

    private String status; // "ACTIVE" or "PAUSED"
    private Boolean isPaused;

    public UpdateRecurringStatusRequest() {}

    public UpdateRecurringStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsPaused() {
        return isPaused;
    }

    public void setIsPaused(Boolean isPaused) {
        this.isPaused = isPaused;
    }
}

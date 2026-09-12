package com.runway.dto;

public class ForgotPasswordResponse {

    private String message;
    private String devResetLink; // Provided in dev mode for 1-click testability

    public ForgotPasswordResponse() {}

    public ForgotPasswordResponse(String message, String devResetLink) {
        this.message = message;
        this.devResetLink = devResetLink;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getDevResetLink() { return devResetLink; }
    public void setDevResetLink(String devResetLink) { this.devResetLink = devResetLink; }
}

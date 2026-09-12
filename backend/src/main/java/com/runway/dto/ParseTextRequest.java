package com.runway.dto;

import jakarta.validation.constraints.NotBlank;

public class ParseTextRequest {

    @NotBlank(message = "Text is required")
    private String text;

    public ParseTextRequest() {}

    public ParseTextRequest(String text) {
        this.text = text;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}

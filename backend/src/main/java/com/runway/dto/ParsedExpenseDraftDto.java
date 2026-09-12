package com.runway.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ParsedExpenseDraftDto {
    private BigDecimal amount;
    private String currency;
    private UUID categoryId;
    private String categoryName;
    private String merchant;
    private String description;
    private double confidence;
    private Instant occurredAt;
    private String rawInput;

    public ParsedExpenseDraftDto() {}

    public ParsedExpenseDraftDto(BigDecimal amount, String currency, UUID categoryId, String categoryName, String merchant, String description, double confidence, Instant occurredAt, String rawInput) {
        this.amount = amount;
        this.currency = currency;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.merchant = merchant;
        this.description = description;
        this.confidence = confidence;
        this.occurredAt = occurredAt;
        this.rawInput = rawInput;
    }

    public static ParsedExpenseDraftDtoBuilder builder() {
        return new ParsedExpenseDraftDtoBuilder();
    }

    public static class ParsedExpenseDraftDtoBuilder {
        private BigDecimal amount;
        private String currency;
        private UUID categoryId;
        private String categoryName;
        private String merchant;
        private String description;
        private double confidence;
        private Instant occurredAt;
        private String rawInput;

        public ParsedExpenseDraftDtoBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public ParsedExpenseDraftDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public ParsedExpenseDraftDtoBuilder categoryId(UUID categoryId) { this.categoryId = categoryId; return this; }
        public ParsedExpenseDraftDtoBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }
        public ParsedExpenseDraftDtoBuilder merchant(String merchant) { this.merchant = merchant; return this; }
        public ParsedExpenseDraftDtoBuilder description(String description) { this.description = description; return this; }
        public ParsedExpenseDraftDtoBuilder confidence(double confidence) { this.confidence = confidence; return this; }
        public ParsedExpenseDraftDtoBuilder occurredAt(Instant occurredAt) { this.occurredAt = occurredAt; return this; }
        public ParsedExpenseDraftDtoBuilder rawInput(String rawInput) { this.rawInput = rawInput; return this; }

        public ParsedExpenseDraftDto build() {
            return new ParsedExpenseDraftDto(amount, currency, categoryId, categoryName, merchant, description, confidence, occurredAt, rawInput);
        }
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public String getRawInput() { return rawInput; }
    public void setRawInput(String rawInput) { this.rawInput = rawInput; }
}

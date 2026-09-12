package com.runway.dto;

import com.runway.entity.ExpenseSource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ExpenseDto {
    private UUID id;
    private UUID userId;
    private BigDecimal amount;
    private String currency;
    private CategoryDto category;
    private String merchant;
    private String description;
    private Instant occurredAt;
    private ExpenseSource source;
    private String rawInput;
    private Instant createdAt;

    public ExpenseDto() {}

    public ExpenseDto(UUID id, UUID userId, BigDecimal amount, String currency, CategoryDto category, String merchant, String description, Instant occurredAt, ExpenseSource source, String rawInput, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.category = category;
        this.merchant = merchant;
        this.description = description;
        this.occurredAt = occurredAt;
        this.source = source;
        this.rawInput = rawInput;
        this.createdAt = createdAt;
    }

    public static ExpenseDtoBuilder builder() {
        return new ExpenseDtoBuilder();
    }

    public static class ExpenseDtoBuilder {
        private UUID id;
        private UUID userId;
        private BigDecimal amount;
        private String currency;
        private CategoryDto category;
        private String merchant;
        private String description;
        private Instant occurredAt;
        private ExpenseSource source;
        private String rawInput;
        private Instant createdAt;

        public ExpenseDtoBuilder id(UUID id) { this.id = id; return this; }
        public ExpenseDtoBuilder userId(UUID userId) { this.userId = userId; return this; }
        public ExpenseDtoBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public ExpenseDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public ExpenseDtoBuilder category(CategoryDto category) { this.category = category; return this; }
        public ExpenseDtoBuilder merchant(String merchant) { this.merchant = merchant; return this; }
        public ExpenseDtoBuilder description(String description) { this.description = description; return this; }
        public ExpenseDtoBuilder occurredAt(Instant occurredAt) { this.occurredAt = occurredAt; return this; }
        public ExpenseDtoBuilder source(ExpenseSource source) { this.source = source; return this; }
        public ExpenseDtoBuilder rawInput(String rawInput) { this.rawInput = rawInput; return this; }
        public ExpenseDtoBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public ExpenseDto build() {
            return new ExpenseDto(id, userId, amount, currency, category, merchant, description, occurredAt, source, rawInput, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public CategoryDto getCategory() { return category; }
    public void setCategory(CategoryDto category) { this.category = category; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public ExpenseSource getSource() { return source; }
    public void setSource(ExpenseSource source) { this.source = source; }

    public String getRawInput() { return rawInput; }
    public void setRawInput(String rawInput) { this.rawInput = rawInput; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

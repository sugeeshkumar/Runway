package com.runway.dto;

import com.runway.entity.Cadence;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class RecurringTemplateDto {
    private UUID id;
    private UUID userId;
    private BigDecimal amount;
    private String currency;
    private CategoryDto category;
    private Cadence cadence;
    private LocalDate nextDueDate;
    private String description;
    private boolean isPaused;

    public RecurringTemplateDto() {}

    public RecurringTemplateDto(UUID id, UUID userId, BigDecimal amount, String currency, CategoryDto category, Cadence cadence, LocalDate nextDueDate, String description, boolean isPaused) {
        this.id = id;
        this.userId = userId;
        this.amount = amount;
        this.currency = currency;
        this.category = category;
        this.cadence = cadence;
        this.nextDueDate = nextDueDate;
        this.description = description;
        this.isPaused = isPaused;
    }

    public static RecurringTemplateDtoBuilder builder() {
        return new RecurringTemplateDtoBuilder();
    }

    public static class RecurringTemplateDtoBuilder {
        private UUID id;
        private UUID userId;
        private BigDecimal amount;
        private String currency;
        private CategoryDto category;
        private Cadence cadence;
        private LocalDate nextDueDate;
        private String description;
        private boolean isPaused;

        public RecurringTemplateDtoBuilder id(UUID id) { this.id = id; return this; }
        public RecurringTemplateDtoBuilder userId(UUID userId) { this.userId = userId; return this; }
        public RecurringTemplateDtoBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public RecurringTemplateDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public RecurringTemplateDtoBuilder category(CategoryDto category) { this.category = category; return this; }
        public RecurringTemplateDtoBuilder cadence(Cadence cadence) { this.cadence = cadence; return this; }
        public RecurringTemplateDtoBuilder nextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; return this; }
        public RecurringTemplateDtoBuilder description(String description) { this.description = description; return this; }
        public RecurringTemplateDtoBuilder isPaused(boolean isPaused) { this.isPaused = isPaused; return this; }

        public RecurringTemplateDto build() {
            return new RecurringTemplateDto(id, userId, amount, currency, category, cadence, nextDueDate, description, isPaused);
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

    public Cadence getCadence() { return cadence; }
    public void setCadence(Cadence cadence) { this.cadence = cadence; }

    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isPaused() { return isPaused; }
    public void setPaused(boolean paused) { isPaused = paused; }
}

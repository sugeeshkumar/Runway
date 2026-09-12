package com.runway.dto;

import com.runway.entity.Cadence;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class CreateRecurringRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String currency = "USD";

    @NotNull(message = "CategoryId is required")
    private UUID categoryId;

    private Cadence cadence = Cadence.MONTHLY;

    @NotNull(message = "Next due date is required")
    private LocalDate nextDueDate;

    @NotBlank(message = "Description is required")
    private String description;

    public CreateRecurringRequest() {}

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public Cadence getCadence() { return cadence; }
    public void setCadence(Cadence cadence) { this.cadence = cadence; }

    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

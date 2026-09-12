package com.runway.dto;

import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public class UpdateUserSettingsRequest {

    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter ISO code")
    private String defaultCurrency;

    private BigDecimal monthlyIncome;

    public UpdateUserSettingsRequest() {}

    public UpdateUserSettingsRequest(String defaultCurrency, BigDecimal monthlyIncome) {
        this.defaultCurrency = defaultCurrency;
        this.monthlyIncome = monthlyIncome;
    }

    public String getDefaultCurrency() { return defaultCurrency; }
    public void setDefaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; }

    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
}

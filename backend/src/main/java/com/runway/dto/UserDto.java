package com.runway.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private String defaultCurrency;
    private BigDecimal monthlyIncome;

    public UserDto() {}

    public UserDto(UUID id, String email, String defaultCurrency, BigDecimal monthlyIncome) {
        this.id = id;
        this.email = email;
        this.defaultCurrency = defaultCurrency;
        this.monthlyIncome = monthlyIncome;
    }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }

    public static class UserDtoBuilder {
        private UUID id;
        private String email;
        private String defaultCurrency;
        private BigDecimal monthlyIncome;

        public UserDtoBuilder id(UUID id) { this.id = id; return this; }
        public UserDtoBuilder email(String email) { this.email = email; return this; }
        public UserDtoBuilder defaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; return this; }
        public UserDtoBuilder monthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; return this; }

        public UserDto build() { return new UserDto(id, email, defaultCurrency, monthlyIncome); }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDefaultCurrency() { return defaultCurrency; }
    public void setDefaultCurrency(String defaultCurrency) { this.defaultCurrency = defaultCurrency; }

    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }
}

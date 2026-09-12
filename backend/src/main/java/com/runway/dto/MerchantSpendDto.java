package com.runway.dto;

import java.math.BigDecimal;

public class MerchantSpendDto {
    private String merchantName;
    private BigDecimal totalSpent;
    private long transactionCount;
    private double percentageOfTotal;

    public MerchantSpendDto() {}

    public MerchantSpendDto(String merchantName, BigDecimal totalSpent, long transactionCount, double percentageOfTotal) {
        this.merchantName = merchantName;
        this.totalSpent = totalSpent;
        this.transactionCount = transactionCount;
        this.percentageOfTotal = percentageOfTotal;
    }

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(long transactionCount) { this.transactionCount = transactionCount; }

    public double getPercentageOfTotal() { return percentageOfTotal; }
    public void setPercentageOfTotal(double percentageOfTotal) { this.percentageOfTotal = percentageOfTotal; }

    public static MerchantSpendDtoBuilder builder() { return new MerchantSpendDtoBuilder(); }

    public static class MerchantSpendDtoBuilder {
        private String merchantName;
        private BigDecimal totalSpent;
        private long transactionCount;
        private double percentageOfTotal;

        public MerchantSpendDtoBuilder merchantName(String merchantName) { this.merchantName = merchantName; return this; }
        public MerchantSpendDtoBuilder totalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; return this; }
        public MerchantSpendDtoBuilder transactionCount(long transactionCount) { this.transactionCount = transactionCount; return this; }
        public MerchantSpendDtoBuilder percentageOfTotal(double percentageOfTotal) { this.percentageOfTotal = percentageOfTotal; return this; }

        public MerchantSpendDto build() {
            return new MerchantSpendDto(merchantName, totalSpent, transactionCount, percentageOfTotal);
        }
    }
}

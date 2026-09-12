package com.runway.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class DuplicateCheckDto {

    private boolean isDuplicate;
    private UUID existingExpenseId;
    private String timeAgoMessage;
    private BigDecimal amount;
    private String merchant;
    private String categoryName;

    public DuplicateCheckDto() {}

    public DuplicateCheckDto(boolean isDuplicate, UUID existingExpenseId, String timeAgoMessage, BigDecimal amount, String merchant, String categoryName) {
        this.isDuplicate = isDuplicate;
        this.existingExpenseId = existingExpenseId;
        this.timeAgoMessage = timeAgoMessage;
        this.amount = amount;
        this.merchant = merchant;
        this.categoryName = categoryName;
    }

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean duplicate) { isDuplicate = duplicate; }

    public UUID getExistingExpenseId() { return existingExpenseId; }
    public void setExistingExpenseId(UUID existingExpenseId) { this.existingExpenseId = existingExpenseId; }

    public String getTimeAgoMessage() { return timeAgoMessage; }
    public void setTimeAgoMessage(String timeAgoMessage) { this.timeAgoMessage = timeAgoMessage; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}

package com.runway.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class LedgerBalancesDto {

    private UUID ledgerId;
    private String ledgerName;
    private String baseCurrency;
    private BigDecimal totalSpent;
    private List<ParticipantBalanceDto> participantBalances;
    private List<SettleTransactionDto> settleTransactions; // Minimal debt-netting transactions

    public LedgerBalancesDto() {}

    public LedgerBalancesDto(UUID ledgerId, String ledgerName, String baseCurrency, BigDecimal totalSpent, List<ParticipantBalanceDto> participantBalances, List<SettleTransactionDto> settleTransactions) {
        this.ledgerId = ledgerId;
        this.ledgerName = ledgerName;
        this.baseCurrency = baseCurrency;
        this.totalSpent = totalSpent;
        this.participantBalances = participantBalances;
        this.settleTransactions = settleTransactions;
    }

    public UUID getLedgerId() { return ledgerId; }
    public void setLedgerId(UUID ledgerId) { this.ledgerId = ledgerId; }

    public String getLedgerName() { return ledgerName; }
    public void setLedgerName(String ledgerName) { this.ledgerName = ledgerName; }

    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public List<ParticipantBalanceDto> getParticipantBalances() { return participantBalances; }
    public void setParticipantBalances(List<ParticipantBalanceDto> participantBalances) { this.participantBalances = participantBalances; }

    public List<SettleTransactionDto> getSettleTransactions() { return settleTransactions; }
    public void setSettleTransactions(List<SettleTransactionDto> settleTransactions) { this.settleTransactions = settleTransactions; }
}

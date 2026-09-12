package com.runway.service;

import com.runway.dto.ParticipantBalanceDto;
import com.runway.dto.SettleTransactionDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class SharedLedgerServiceTest {

    @Test
    @DisplayName("Verify Zero-Sum Invariant and Debt Netting Accuracy across 4-Person Trip")
    public void testDebtNettingCalculations() {
        UUID youId = UUID.randomUUID();
        UUID aliceId = UUID.randomUUID();
        UUID bobId = UUID.randomUUID();
        UUID charlieId = UUID.randomUUID();

        // Mock Participant Balances based on real scenario
        // Item 1: You pay 4000 split 4 ways (You: 1000, Alice: 1000, Bob: 1000, Charlie: 1000)
        // Item 2: Alice pays 2000 split between Alice & Bob (Alice: 1000, Bob: 1000)
        // Item 3: You pay 1500 custom for Charlie (Charlie: 1500)
        // Item 4: Bob pays 8000 split Bob 4000, Alice 2000, Charlie 2000

        // Calculated totals:
        // You: Paid 5500, Owed 1000, Net = +4500
        // Alice: Paid 2000, Owed 4000, Net = -2000
        // Bob: Paid 8000, Owed 6000, Net = +2000
        // Charlie: Paid 0, Owed 4500, Net = -4500

        List<ParticipantBalanceDto> balances = Arrays.asList(
                new ParticipantBalanceDto(youId, "You", new BigDecimal("5500.00"), new BigDecimal("1000.00"), new BigDecimal("4500.00")),
                new ParticipantBalanceDto(aliceId, "Alice", new BigDecimal("2000.00"), new BigDecimal("4000.00"), new BigDecimal("-2000.00")),
                new ParticipantBalanceDto(bobId, "Bob", new BigDecimal("8000.00"), new BigDecimal("6000.00"), new BigDecimal("2000.00")),
                new ParticipantBalanceDto(charlieId, "Charlie", BigDecimal.ZERO, new BigDecimal("4500.00"), new BigDecimal("-4500.00"))
        );

        // 1. Verify Zero-Sum Conservation Invariant
        BigDecimal sumNet = balances.stream()
                .map(ParticipantBalanceDto::getNetBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, BigDecimal.ZERO.compareTo(sumNet), "Total net sum across all participants MUST be exactly zero");

        // 2. Verify Debt Netting Algorithm output
        List<SettleTransactionDto> transactions = computeMinimalSettleUp(balances, "INR");

        // Verify exactly 2 transactions produced
        assertEquals(2, transactions.size(), "Minimal debt netting should collapse 4 participants into exactly 2 transactions");

        // Transaction 1: Charlie pays You 4500
        SettleTransactionDto tx1 = transactions.get(0);
        assertEquals("Charlie", tx1.getFromParticipantName());
        assertEquals("You", tx1.getToParticipantName());
        assertEquals(new BigDecimal("4500.00"), tx1.getAmount());

        // Transaction 2: Alice pays Bob 2000
        SettleTransactionDto tx2 = transactions.get(1);
        assertEquals("Alice", tx2.getFromParticipantName());
        assertEquals("Bob", tx2.getToParticipantName());
        assertEquals(new BigDecimal("2000.00"), tx2.getAmount());
    }

    private List<SettleTransactionDto> computeMinimalSettleUp(List<ParticipantBalanceDto> balances, String currency) {
        class BalanceNode {
            UUID id;
            String name;
            BigDecimal amount;

            BalanceNode(UUID id, String name, BigDecimal amount) {
                this.id = id;
                this.name = name;
                this.amount = amount;
            }
        }

        List<BalanceNode> debtors = new ArrayList<>();
        List<BalanceNode> creditors = new ArrayList<>();

        for (ParticipantBalanceDto b : balances) {
            if (b.getNetBalance().compareTo(BigDecimal.valueOf(0.01)) > 0) {
                creditors.add(new BalanceNode(b.getParticipantId(), b.getParticipantName(), b.getNetBalance()));
            } else if (b.getNetBalance().compareTo(BigDecimal.valueOf(-0.01)) < 0) {
                debtors.add(new BalanceNode(b.getParticipantId(), b.getParticipantName(), b.getNetBalance().abs()));
            }
        }

        debtors.sort((a, b) -> b.amount.compareTo(a.amount));
        creditors.sort((a, b) -> b.amount.compareTo(a.amount));

        List<SettleTransactionDto> transactions = new ArrayList<>();

        int dIdx = 0;
        int cIdx = 0;

        while (dIdx < debtors.size() && cIdx < creditors.size()) {
            BalanceNode debtor = debtors.get(dIdx);
            BalanceNode creditor = creditors.get(cIdx);

            BigDecimal settleAmount = debtor.amount.min(creditor.amount).setScale(2, RoundingMode.HALF_UP);

            if (settleAmount.compareTo(BigDecimal.ZERO) > 0) {
                transactions.add(new SettleTransactionDto(
                        debtor.id, debtor.name,
                        creditor.id, creditor.name,
                        settleAmount, currency
                ));
            }

            debtor.amount = debtor.amount.subtract(settleAmount);
            creditor.amount = creditor.amount.subtract(settleAmount);

            if (debtor.amount.compareTo(BigDecimal.valueOf(0.01)) < 0) {
                dIdx++;
            }
            if (creditor.amount.compareTo(BigDecimal.valueOf(0.01)) < 0) {
                cIdx++;
            }
        }

        return transactions;
    }
}

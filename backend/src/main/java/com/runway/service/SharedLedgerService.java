package com.runway.service;

import com.runway.dto.*;
import com.runway.entity.*;
import com.runway.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SharedLedgerService {

    private final SharedLedgerRepository ledgerRepository;
    private final LedgerParticipantRepository participantRepository;
    private final SharedExpenseRepository expenseRepository;
    private final SharedExpenseSplitRepository splitRepository;
    private final ExpenseRepository personalExpenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public SharedLedgerService(SharedLedgerRepository ledgerRepository,
                               LedgerParticipantRepository participantRepository,
                               SharedExpenseRepository expenseRepository,
                               SharedExpenseSplitRepository splitRepository,
                               ExpenseRepository personalExpenseRepository,
                               CategoryRepository categoryRepository,
                               UserRepository userRepository) {
        this.ledgerRepository = ledgerRepository;
        this.participantRepository = participantRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.personalExpenseRepository = personalExpenseRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SharedLedgerDto> getAllLedgersForUser(UUID userId) {
        User user = getUserOrThrow(userId);
        List<SharedLedger> ledgers = ledgerRepository.findAllForUser(user);
        return ledgers.stream().map(l -> toLedgerDto(l, true)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SharedLedgerDto getLedgerById(UUID ledgerId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);
        return toLedgerDto(ledger, true);
    }

    @Transactional
    public SharedLedgerDto createLedger(CreateLedgerRequest request, UUID userId) {
        User user = getUserOrThrow(userId);

        SharedLedger ledger = new SharedLedger();
        ledger.setOwner(user);
        ledger.setName(request.getName());
        ledger.setType(request.getType() != null ? request.getType() : LedgerType.TRIP);
        ledger.setStartDate(request.getStartDate());
        ledger.setEndDate(request.getEndDate());
        ledger.setBaseCurrency(request.getBaseCurrency() != null ? request.getBaseCurrency() : "INR");
        ledger.setPlannedBudget(request.getPlannedBudget());
        ledger.setSettled(false);

        ledger = ledgerRepository.save(ledger);

        // Add owner as first participant
        String ownerName = user.getEmail().split("@")[0];
        ownerName = Character.toUpperCase(ownerName.charAt(0)) + ownerName.substring(1);
        LedgerParticipant ownerParticipant = new LedgerParticipant(ledger, ownerName + " (You)", user);
        participantRepository.save(ownerParticipant);

        // Add additional participant names if provided
        if (request.getParticipantNames() != null) {
            for (String name : request.getParticipantNames()) {
                if (name != null && !name.trim().isEmpty()) {
                    LedgerParticipant participant = new LedgerParticipant(ledger, name.trim(), null);
                    participantRepository.save(participant);
                }
            }
        }

        return toLedgerDto(ledger, true);
    }

    @Transactional
    public SharedLedgerDto updateLedger(UUID ledgerId, CreateLedgerRequest request, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateOwner(ledger, user);

        ledger.setName(request.getName());
        ledger.setType(request.getType() != null ? request.getType() : LedgerType.TRIP);
        ledger.setStartDate(request.getStartDate());
        ledger.setEndDate(request.getEndDate());
        ledger.setBaseCurrency(request.getBaseCurrency() != null ? request.getBaseCurrency() : "INR");
        ledger.setPlannedBudget(request.getPlannedBudget());

        ledger = ledgerRepository.save(ledger);
        return toLedgerDto(ledger, true);
    }

    @Transactional
    public void deleteLedger(UUID ledgerId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateOwner(ledger, user);
        ledgerRepository.delete(ledger);
    }

    @Transactional
    public LedgerParticipantDto addParticipant(UUID ledgerId, AddParticipantRequest request, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        LedgerParticipant participant = new LedgerParticipant(ledger, request.getDisplayName().trim(), null);
        participant = participantRepository.save(participant);
        return toParticipantDto(participant);
    }

    @Transactional
    public void removeParticipant(UUID ledgerId, UUID participantId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        LedgerParticipant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));

        if (!participant.getLedger().getId().equals(ledgerId)) {
            throw new IllegalArgumentException("Participant does not belong to this ledger");
        }

        participantRepository.delete(participant);
    }

    @Transactional(readOnly = true)
    public List<SharedExpenseDto> getExpensesForLedger(UUID ledgerId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);
        List<SharedExpense> expenses = expenseRepository.findByLedgerOrderByOccurredAtDesc(ledger);
        return expenses.stream().map(this::toExpenseDto).collect(Collectors.toList());
    }

    @Transactional
    public SharedExpenseDto createSharedExpense(UUID ledgerId, CreateSharedExpenseRequest request, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        LedgerParticipant paidBy = participantRepository.findById(request.getPaidByParticipantId())
                .orElseThrow(() -> new IllegalArgumentException("Payer participant not found"));

        if (!paidBy.getLedger().getId().equals(ledgerId)) {
            throw new IllegalArgumentException("Payer participant does not belong to this ledger");
        }

        BigDecimal rate = request.getExchangeRate() != null && request.getExchangeRate().compareTo(BigDecimal.ZERO) > 0
                ? request.getExchangeRate() : BigDecimal.ONE;

        BigDecimal baseAmount = request.getAmount().multiply(rate).setScale(2, RoundingMode.HALF_UP);

        SharedExpense expense = new SharedExpense();
        expense.setLedger(ledger);
        expense.setPaidByParticipant(paidBy);
        expense.setAmount(request.getAmount());
        expense.setCurrency(request.getCurrency() != null ? request.getCurrency() : ledger.getBaseCurrency());
        expense.setExchangeRate(rate);
        expense.setBaseCurrencyAmount(baseAmount);
        expense.setDescription(request.getDescription());
        expense.setSplitType(request.getSplitType() != null ? request.getSplitType() : SplitType.EQUAL);
        expense.setOccurredAt(request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now());

        expense = expenseRepository.save(expense);

        // Parse and calculate splits
        List<LedgerParticipant> allParticipants = participantRepository.findByLedger(ledger);
        if (allParticipants.isEmpty()) {
            throw new IllegalArgumentException("Ledger has no participants to split expense");
        }

        List<SharedExpenseSplit> splits = new ArrayList<>();
        SplitType splitType = expense.getSplitType();

        if (splitType == SplitType.EQUAL) {
            List<LedgerParticipant> targetParticipants = allParticipants;
            if (request.getSplits() != null && !request.getSplits().isEmpty()) {
                Set<UUID> targetIds = request.getSplits().stream().map(CreateSharedExpenseRequest.SplitItemRequest::getParticipantId).collect(Collectors.toSet());
                targetParticipants = allParticipants.stream().filter(p -> targetIds.contains(p.getId())).collect(Collectors.toList());
            }
            if (targetParticipants.isEmpty()) targetParticipants = allParticipants;

            int count = targetParticipants.size();
            BigDecimal baseShare = baseAmount.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
            BigDecimal remainder = baseAmount.subtract(baseShare.multiply(BigDecimal.valueOf(count)));

            for (int i = 0; i < count; i++) {
                BigDecimal share = baseShare;
                if (i == 0) {
                    share = share.add(remainder);
                }
                SharedExpenseSplit split = new SharedExpenseSplit(expense, targetParticipants.get(i), share);
                splits.add(splitRepository.save(split));
            }
        } else if (splitType == SplitType.EXACT) {
            if (request.getSplits() == null || request.getSplits().isEmpty()) {
                throw new IllegalArgumentException("Exact split requires split amounts for participants");
            }
            for (CreateSharedExpenseRequest.SplitItemRequest item : request.getSplits()) {
                LedgerParticipant p = participantRepository.findById(item.getParticipantId())
                        .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
                BigDecimal shareInOriginalCurrency = item.getValue() != null ? item.getValue() : BigDecimal.ZERO;
                BigDecimal shareInBase = shareInOriginalCurrency.multiply(rate).setScale(2, RoundingMode.HALF_UP);
                SharedExpenseSplit split = new SharedExpenseSplit(expense, p, shareInBase);
                splits.add(splitRepository.save(split));
            }
        } else if (splitType == SplitType.PERCENTAGE) {
            if (request.getSplits() == null || request.getSplits().isEmpty()) {
                throw new IllegalArgumentException("Percentage split requires percentage values for participants");
            }
            for (CreateSharedExpenseRequest.SplitItemRequest item : request.getSplits()) {
                LedgerParticipant p = participantRepository.findById(item.getParticipantId())
                        .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
                BigDecimal pct = item.getValue() != null ? item.getValue() : BigDecimal.ZERO;
                BigDecimal shareInBase = baseAmount.multiply(pct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                SharedExpenseSplit split = new SharedExpenseSplit(expense, p, shareInBase);
                splits.add(splitRepository.save(split));
            }
        }

        expense.setSplits(splits);
        return toExpenseDto(expense);
    }

    @Transactional
    public void deleteSharedExpense(UUID ledgerId, UUID expenseId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        SharedExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        if (!expense.getLedger().getId().equals(ledgerId)) {
            throw new IllegalArgumentException("Expense does not belong to this ledger");
        }

        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public LedgerBalancesDto getLedgerBalances(UUID ledgerId, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        List<LedgerParticipant> participants = participantRepository.findByLedger(ledger);
        List<SharedExpense> expenses = expenseRepository.findByLedgerOrderByOccurredAtDesc(ledger);

        Map<UUID, BigDecimal> paidMap = new HashMap<>();
        Map<UUID, BigDecimal> owedMap = new HashMap<>();

        for (LedgerParticipant p : participants) {
            paidMap.put(p.getId(), BigDecimal.ZERO);
            owedMap.put(p.getId(), BigDecimal.ZERO);
        }

        BigDecimal totalSpent = BigDecimal.ZERO;
        for (SharedExpense exp : expenses) {
            totalSpent = totalSpent.add(exp.getBaseCurrencyAmount());
            UUID payerId = exp.getPaidByParticipant().getId();
            paidMap.put(payerId, paidMap.getOrDefault(payerId, BigDecimal.ZERO).add(exp.getBaseCurrencyAmount()));

            for (SharedExpenseSplit split : exp.getSplits()) {
                UUID pId = split.getParticipant().getId();
                owedMap.put(pId, owedMap.getOrDefault(pId, BigDecimal.ZERO).add(split.getShareAmount()));
            }
        }

        List<ParticipantBalanceDto> participantBalances = new ArrayList<>();
        Map<UUID, String> nameMap = new HashMap<>();

        for (LedgerParticipant p : participants) {
            nameMap.put(p.getId(), p.getDisplayName());
            BigDecimal paid = paidMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal owed = owedMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal net = paid.subtract(owed);
            participantBalances.add(new ParticipantBalanceDto(p.getId(), p.getDisplayName(), paid, owed, net));
        }

        // DEBT-NETTING ALGORITHM ENGINE
        List<SettleTransactionDto> settleTransactions = computeMinimalSettleUp(participantBalances, nameMap, ledger.getBaseCurrency());

        return new LedgerBalancesDto(ledger.getId(), ledger.getName(), ledger.getBaseCurrency(), totalSpent, participantBalances, settleTransactions);
    }

    @Transactional
    public SharedLedgerDto settleLedger(UUID ledgerId, SettleLedgerRequest request, UUID userId) {
        User user = getUserOrThrow(userId);
        SharedLedger ledger = getLedgerOrThrow(ledgerId);
        validateAccess(ledger, user);

        ledger.setSettled(true);
        ledger.setSettledAt(Instant.now());
        ledger = ledgerRepository.save(ledger);

        // Optionally roll user's share into personal expense history
        if (request.isRollIntoPersonalHistory()) {
            LedgerBalancesDto balances = getLedgerBalances(ledgerId, userId);

            Optional<ParticipantBalanceDto> userBalOpt = balances.getParticipantBalances().stream()
                    .filter(p -> p.getParticipantName().contains("(You)") ||
                            p.getParticipantName().equalsIgnoreCase(user.getEmail().split("@")[0]))
                    .findFirst();

            BigDecimal userShare = BigDecimal.ZERO;
            if (userBalOpt.isPresent()) {
                userShare = userBalOpt.get().getTotalOwed();
            } else if (!balances.getParticipantBalances().isEmpty()) {
                userShare = balances.getParticipantBalances().get(0).getTotalOwed();
            }

            if (userShare.compareTo(BigDecimal.ZERO) > 0) {
                Category category = null;
                if (request.getPersonalCategoryId() != null) {
                    category = categoryRepository.findById(request.getPersonalCategoryId()).orElse(null);
                }
                if (category == null) {
                    List<Category> categories = categoryRepository.findAllAvailableForUser(userId);
                    if (!categories.isEmpty()) {
                        category = categories.get(0);
                    }
                }

                if (category != null) {
                    Expense personalExpense = Expense.builder()
                            .user(user)
                            .amount(userShare)
                            .currency(ledger.getBaseCurrency())
                            .category(category)
                            .description("[Reconciled] Trip: " + ledger.getName())
                            .occurredAt(Instant.now())
                            .source(ExpenseSource.MANUAL)
                            .build();
                    personalExpenseRepository.save(personalExpense);
                }
            }
        }

        return toLedgerDto(ledger, true);
    }

    private List<SettleTransactionDto> computeMinimalSettleUp(List<ParticipantBalanceDto> balances, Map<UUID, String> nameMap, String currency) {
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

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private SharedLedger getLedgerOrThrow(UUID ledgerId) {
        return ledgerRepository.findById(ledgerId)
                .orElseThrow(() -> new IllegalArgumentException("Shared Ledger not found"));
    }

    private void validateOwner(SharedLedger ledger, User user) {
        if (!ledger.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Only the ledger owner can modify ledger settings");
        }
    }

    private void validateAccess(SharedLedger ledger, User user) {
        if (ledger.getOwner().getId().equals(user.getId())) {
            return;
        }
        boolean isParticipant = participantRepository.findByLedger(ledger).stream()
                .anyMatch(p -> p.getLinkedUser() != null && p.getLinkedUser().getId().equals(user.getId()));
        if (!isParticipant) {
            throw new IllegalArgumentException("Access denied to shared ledger");
        }
    }

    private SharedLedgerDto toLedgerDto(SharedLedger ledger, boolean includeParticipants) {
        SharedLedgerDto dto = new SharedLedgerDto();
        dto.setId(ledger.getId());
        dto.setOwnerId(ledger.getOwner().getId());
        dto.setOwnerEmail(ledger.getOwner().getEmail());
        dto.setName(ledger.getName());
        dto.setType(ledger.getType());
        dto.setStartDate(ledger.getStartDate());
        dto.setEndDate(ledger.getEndDate());
        dto.setBaseCurrency(ledger.getBaseCurrency());
        dto.setPlannedBudget(ledger.getPlannedBudget());
        dto.setSettled(ledger.isSettled());
        dto.setSettledAt(ledger.getSettledAt());
        dto.setCreatedAt(ledger.getCreatedAt());

        BigDecimal totalSpent = expenseRepository.findByLedgerOrderByOccurredAtDesc(ledger).stream()
                .map(SharedExpense::getBaseCurrencyAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalSpentInBase(totalSpent);

        if (includeParticipants) {
            List<LedgerParticipant> participants = participantRepository.findByLedger(ledger);
            dto.setParticipants(participants.stream().map(this::toParticipantDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private LedgerParticipantDto toParticipantDto(LedgerParticipant participant) {
        return new LedgerParticipantDto(
                participant.getId(),
                participant.getLedger().getId(),
                participant.getDisplayName(),
                participant.getLinkedUser() != null ? participant.getLinkedUser().getId() : null,
                participant.getLinkedUser() != null ? participant.getLinkedUser().getEmail() : null
        );
    }

    private SharedExpenseDto toExpenseDto(SharedExpense expense) {
        SharedExpenseDto dto = new SharedExpenseDto();
        dto.setId(expense.getId());
        dto.setLedgerId(expense.getLedger().getId());
        dto.setPaidByParticipantId(expense.getPaidByParticipant().getId());
        dto.setPaidByParticipantName(expense.getPaidByParticipant().getDisplayName());
        dto.setAmount(expense.getAmount());
        dto.setCurrency(expense.getCurrency());
        dto.setExchangeRate(expense.getExchangeRate());
        dto.setBaseCurrencyAmount(expense.getBaseCurrencyAmount());
        dto.setDescription(expense.getDescription());
        dto.setSplitType(expense.getSplitType());
        dto.setOccurredAt(expense.getOccurredAt());
        dto.setCreatedAt(expense.getCreatedAt());

        List<SharedExpenseSplitDto> splits = expense.getSplits().stream().map(s -> new SharedExpenseSplitDto(
                s.getId(), s.getParticipant().getId(), s.getParticipant().getDisplayName(), s.getShareAmount()
        )).collect(Collectors.toList());
        dto.setSplits(splits);

        return dto;
    }
}

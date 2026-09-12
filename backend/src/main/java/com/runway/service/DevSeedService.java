package com.runway.service;

import com.runway.dto.AddParticipantRequest;
import com.runway.dto.CreateLedgerRequest;
import com.runway.dto.CreateSharedExpenseRequest;
import com.runway.entity.*;
import com.runway.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class DevSeedService {

    private static final Logger log = LoggerFactory.getLogger(DevSeedService.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringRepository recurringRepository;
    private final SharedLedgerService sharedLedgerService;
    private final SavingsGoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;

    public DevSeedService(UserRepository userRepository,
                          CategoryRepository categoryRepository,
                          ExpenseRepository expenseRepository,
                          BudgetRepository budgetRepository,
                          RecurringRepository recurringRepository,
                          SharedLedgerService sharedLedgerService,
                          SavingsGoalRepository goalRepository,
                          GoalContributionRepository contributionRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.recurringRepository = recurringRepository;
        this.sharedLedgerService = sharedLedgerService;
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
    }

    @Transactional
    public Map<String, Object> seedDemoData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setMonthlyIncome(new BigDecimal("100000.00")); // ₹1,00,000 monthly income
        user.setDefaultCurrency("INR");
        userRepository.save(user);

        // 1. Ensure Categories
        List<Category> categories = categoryRepository.findAllAvailableForUser(user.getId());
        Map<String, Category> catMap = new HashMap<>();

        String[][] catDefs = {
            {"Dining & Food", "#84CC16"},
            {"Groceries", "#10B981"},
            {"Housing & Rent", "#3B82F6"},
            {"Subscriptions", "#8B5CF6"},
            {"Shopping", "#EC4899"},
            {"Transport", "#F59E0B"},
            {"Entertainment", "#06B6D4"}
        };

        for (String[] def : catDefs) {
            String name = def[0];
            String color = def[1];
            Category cat = categories.stream()
                    .filter(c -> c.getName().equalsIgnoreCase(name))
                    .findFirst()
                    .orElseGet(() -> {
                        Category newCat = Category.builder().user(user).name(name).color(color).build();
                        return categoryRepository.save(newCat);
                    });
            catMap.put(name, cat);
        }

        // 2. Clear old demo data for clean seed
        expenseRepository.deleteAll(expenseRepository.findByUserIdOrderByOccurredAtDesc(user.getId()));
        budgetRepository.deleteAll(budgetRepository.findByUserId(user.getId()));
        recurringRepository.deleteAll(recurringRepository.findByUserIdOrderByNextDueDateAsc(user.getId()));

        // 3. Seed Realistic Historical Expenses (Last 60 Days)
        LocalDate today = LocalDate.now();
        Random rand = new Random(42);

        Object[][] sampleItems = {
            {"Dining & Food", "Blue Tokai Coffee", 240.0, "INR"},
            {"Dining & Food", "Swiggy Dinner Order", 680.0, "INR"},
            {"Groceries", "Nature Basket Organic Veggies", 1450.0, "INR"},
            {"Groceries", "Zepto Quick Delivery", 320.0, "INR"},
            {"Transport", "Uber Premier to Office", 420.0, "INR"},
            {"Transport", "Shell Fuel Station Petrol", 2500.0, "INR"},
            {"Shopping", "Amazon Ergonomic Mouse", 1890.0, "INR"},
            {"Shopping", "Zara Linen Shirt", 3290.0, "INR"},
            {"Entertainment", "PVR IMAX Movie Tickets", 950.0, "INR"},
            {"Subscriptions", "Github Copilot Pro", 10.0, "USD"},
            {"Subscriptions", "Spotify Premium Family", 179.0, "INR"}
        };

        int expenseCount = 0;
        for (int dayOffset = 0; dayOffset < 60; dayOffset++) {
            LocalDate date = today.minusDays(dayOffset);
            int dailyItemsCount = rand.nextInt(3) + 1; // 1 to 3 items per day

            for (int i = 0; i < dailyItemsCount; i++) {
                Object[] item = sampleItems[rand.nextInt(sampleItems.length)];
                String catName = (String) item[0];
                String merchant = (String) item[1];
                double baseAmt = (Double) item[2];
                String curr = (String) item[3];

                double varFactor = 0.8 + (1.2 - 0.8) * rand.nextDouble();
                BigDecimal finalAmount = BigDecimal.valueOf(baseAmt * varFactor).setScale(2, java.math.RoundingMode.HALF_UP);

                Category cat = catMap.getOrDefault(catName, catMap.values().iterator().next());
                Instant occurredAt = date.atTime(rand.nextInt(12) + 9, rand.nextInt(60))
                        .atZone(ZoneId.systemDefault()).toInstant();

                Expense exp = Expense.builder()
                        .user(user)
                        .amount(finalAmount)
                        .currency(curr)
                        .category(cat)
                        .merchant(merchant)
                        .description(merchant + " purchase")
                        .occurredAt(occurredAt)
                        .source(ExpenseSource.MANUAL)
                        .build();

                expenseRepository.save(exp);
                expenseCount++;
            }
        }

        // 4. Seed Recurring Expense Templates
        Category rentCat = catMap.getOrDefault("Housing & Rent", catMap.values().iterator().next());
        Category subCat = catMap.getOrDefault("Subscriptions", catMap.values().iterator().next());

        RecurringExpenseTemplate rentTmpl = RecurringExpenseTemplate.builder()
                .user(user)
                .amount(new BigDecimal("28000.00"))
                .currency("INR")
                .category(rentCat)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(today.plusDays(3))
                .description("Apartment Rent & Maintenance")
                .isPaused(false)
                .build();

        RecurringExpenseTemplate netflixTmpl = RecurringExpenseTemplate.builder()
                .user(user)
                .amount(new BigDecimal("15.99"))
                .currency("USD")
                .category(subCat)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(today.plusDays(10))
                .description("Netflix Ultra HD Subscription")
                .isPaused(false)
                .build();

        RecurringExpenseTemplate gymTmpl = RecurringExpenseTemplate.builder()
                .user(user)
                .amount(new BigDecimal("3500.00"))
                .currency("INR")
                .category(catMap.getOrDefault("Entertainment", rentCat))
                .cadence(Cadence.MONTHLY)
                .nextDueDate(today.plusDays(18))
                .description("Gold's Gym Membership")
                .isPaused(false)
                .build();

        recurringRepository.save(rentTmpl);
        recurringRepository.save(netflixTmpl);
        recurringRepository.save(gymTmpl);

        // 5. Seed Budgets
        String currentMonth = today.getYear() + "-" + String.format("%02d", today.getMonthValue());

        Budget overallBudget = Budget.builder()
                .user(user)
                .category(null)
                .periodMonth(currentMonth)
                .amount(new BigDecimal("80000.00"))
                .build();

        Budget diningBudget = Budget.builder()
                .user(user)
                .category(catMap.get("Dining & Food"))
                .periodMonth(currentMonth)
                .amount(new BigDecimal("15000.00"))
                .build();

        budgetRepository.save(overallBudget);
        budgetRepository.save(diningBudget);

        // 6. Seed Shared Ledger (Goa Beach Trip 2026)
        CreateLedgerRequest ledgerReq = new CreateLedgerRequest();
        ledgerReq.setName("Goa Beach Trip 2026");
        ledgerReq.setType(LedgerType.TRIP);
        ledgerReq.setStartDate(today.minusDays(5));
        ledgerReq.setEndDate(today.plusDays(2));
        ledgerReq.setBaseCurrency("INR");
        ledgerReq.setPlannedBudget(new BigDecimal("30000.00")); // ₹10,000 per person x 3 members
        ledgerReq.setParticipantNames(Arrays.asList("Bob", "Charlie"));

        var ledgerDto = sharedLedgerService.createLedger(ledgerReq, user.getId());
        UUID ledgerId = ledgerDto.getId();

        var pList = ledgerDto.getParticipants();
        UUID sugeeshId = pList.stream().filter(p -> p.getDisplayName().contains("(You)")).findFirst().get().getId();
        UUID bobId = pList.stream().filter(p -> p.getDisplayName().equalsIgnoreCase("Bob")).findFirst().get().getId();
        UUID charlieId = pList.stream().filter(p -> p.getDisplayName().equalsIgnoreCase("Charlie")).findFirst().get().getId();

        // Expense 1: Sugeesh paid ₹9,000 for Villa Airbnb
        CreateSharedExpenseRequest exp1 = new CreateSharedExpenseRequest();
        exp1.setPaidByParticipantId(sugeeshId);
        exp1.setAmount(new BigDecimal("9000.00"));
        exp1.setCurrency("INR");
        exp1.setDescription("Private Beach Villa Stay");
        exp1.setSplitType(SplitType.EQUAL);
        sharedLedgerService.createSharedExpense(ledgerId, exp1, user.getId());

        // Expense 2: Bob paid ₹6,000 for Beach Dinner
        CreateSharedExpenseRequest exp2 = new CreateSharedExpenseRequest();
        exp2.setPaidByParticipantId(bobId);
        exp2.setAmount(new BigDecimal("6000.00"));
        exp2.setCurrency("INR");
        exp2.setDescription("Thalassa Seafood Dinner");
        exp2.setSplitType(SplitType.EQUAL);
        sharedLedgerService.createSharedExpense(ledgerId, exp2, user.getId());

        // Expense 3: Charlie paid $100 for Scuba Diving
        CreateSharedExpenseRequest exp3 = new CreateSharedExpenseRequest();
        exp3.setPaidByParticipantId(charlieId);
        exp3.setAmount(new BigDecimal("100.00"));
        exp3.setCurrency("USD");
        exp3.setExchangeRate(new BigDecimal("85.00"));
        exp3.setDescription("Scuba Diving & Underwater Photos");
        exp3.setSplitType(SplitType.EQUAL);
        sharedLedgerService.createSharedExpense(ledgerId, exp3, user.getId());

        // Expense 4: Sugeesh paid ₹2,400 for Scooter Rental
        CreateSharedExpenseRequest exp4 = new CreateSharedExpenseRequest();
        exp4.setPaidByParticipantId(sugeeshId);
        exp4.setAmount(new BigDecimal("2400.00"));
        exp4.setCurrency("INR");
        exp4.setDescription("Scooter & Bike Rentals");
        exp4.setSplitType(SplitType.EQUAL);
        sharedLedgerService.createSharedExpense(ledgerId, exp4, user.getId());

        // 6. Seed Savings Goals
        goalRepository.deleteAll(goalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));

        SavingsGoal goal1 = SavingsGoal.builder()
                .user(user)
                .name("Emergency Fund (6 Months)")
                .targetAmount(new BigDecimal("300000.00"))
                .targetDate(LocalDate.now().plusMonths(12))
                .currency("INR")
                .build();
        goal1 = goalRepository.save(goal1);

        GoalContribution gc1 = GoalContribution.builder()
                .goal(goal1)
                .amount(new BigDecimal("50000.00"))
                .occurredAt(Instant.now().minus(45, ChronoUnit.DAYS))
                .note("Initial monthly surplus deposit")
                .build();
        GoalContribution gc2 = GoalContribution.builder()
                .goal(goal1)
                .amount(new BigDecimal("40000.00"))
                .occurredAt(Instant.now().minus(20, ChronoUnit.DAYS))
                .note("Bonus allocation")
                .build();
        GoalContribution gc3 = GoalContribution.builder()
                .goal(goal1)
                .amount(new BigDecimal("35000.00"))
                .occurredAt(Instant.now().minus(5, ChronoUnit.DAYS))
                .note("End of month savings deposit")
                .build();
        contributionRepository.saveAll(List.of(gc1, gc2, gc3));

        SavingsGoal goal2 = SavingsGoal.builder()
                .user(user)
                .name("Japan Autumn Trip 2027")
                .targetAmount(new BigDecimal("250000.00"))
                .targetDate(LocalDate.now().plusMonths(14))
                .currency("INR")
                .build();
        goal2 = goalRepository.save(goal2);

        GoalContribution gc4 = GoalContribution.builder()
                .goal(goal2)
                .amount(new BigDecimal("30000.00"))
                .occurredAt(Instant.now().minus(30, ChronoUnit.DAYS))
                .note("Flight booking fund deposit")
                .build();
        GoalContribution gc5 = GoalContribution.builder()
                .goal(goal2)
                .amount(new BigDecimal("30000.00"))
                .occurredAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .note("Hotel savings allocation")
                .build();
        contributionRepository.saveAll(List.of(gc4, gc5));

        log.info("Successfully seeded demo data for user {}: {} expenses, 3 templates, 2 budgets, 2 savings goals, 1 shared ledger.",
                user.getEmail(), expenseCount);

        return Map.of(
            "message", "Demo data successfully seeded!",
            "expensesCreated", expenseCount,
            "recurringTemplatesCreated", 3,
            "budgetsCreated", 2,
            "goalsCreated", 2,
            "sharedLedgerCreated", "Goa Beach Trip 2026"
        );
    }
}

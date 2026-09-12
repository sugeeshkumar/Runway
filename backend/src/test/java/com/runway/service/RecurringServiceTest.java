package com.runway.service;

import com.runway.dto.CommittedSummaryDto;
import com.runway.dto.CreateRecurringRequest;
import com.runway.dto.RecurringTemplateDto;
import com.runway.entity.*;
import com.runway.repository.*;
import com.runway.scheduler.RecurringScheduler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RecurringServiceTest {

    @Mock
    private RecurringRepository recurringRepository;

    @Mock
    private GeneratedRecurringChargeRepository generatedChargeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private RecurringScheduler recurringScheduler;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private RecurringService recurringService;

    private User testUser;
    private Category housingCategory;
    private Category entertainmentCategory;
    private RecurringExpenseTemplate rentTemplate;
    private RecurringExpenseTemplate netflixTemplate;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("sugeesh.murali@gmail.com");
        testUser.setDefaultCurrency("INR");
        testUser.setMonthlyIncome(new BigDecimal("150000.00"));

        housingCategory = new Category();
        housingCategory.setId(UUID.randomUUID());
        housingCategory.setName("Housing");
        housingCategory.setColor("#EF4444");

        entertainmentCategory = new Category();
        entertainmentCategory.setId(UUID.randomUUID());
        entertainmentCategory.setName("Entertainment");
        entertainmentCategory.setColor("#8B5CF6");

        rentTemplate = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("25000.00"))
                .currency("INR")
                .category(housingCategory)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(LocalDate.now().minusDays(1))
                .description("Monthly Rent")
                .isPaused(false)
                .build();

        netflixTemplate = RecurringExpenseTemplate.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("649.00"))
                .currency("INR")
                .category(entertainmentCategory)
                .cadence(Cadence.MONTHLY)
                .nextDueDate(LocalDate.now().plusDays(15))
                .description("Netflix Subscription")
                .isPaused(false)
                .build();
    }

    @Test
    @DisplayName("Get recurring templates for user returns mapped DTOs")
    void testGetRecurringTemplatesForUser() {
        when(recurringRepository.findByUserIdOrderByNextDueDateAsc(testUser.getId()))
                .thenReturn(List.of(rentTemplate, netflixTemplate));

        List<RecurringTemplateDto> result = recurringService.getRecurringTemplatesForUser(testUser.getId());

        assertEquals(2, result.size());
        assertEquals("Monthly Rent", result.get(0).getDescription());
        assertEquals(new BigDecimal("25000.00"), result.get(0).getAmount());
        assertEquals("Netflix Subscription", result.get(1).getDescription());
    }

    @Test
    @DisplayName("Committed summary calculates total monthly commitments and income ratio accurately")
    void testGetCommittedSummary_WithIncome() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(recurringRepository.findByUserIdOrderByNextDueDateAsc(testUser.getId()))
                .thenReturn(List.of(rentTemplate, netflixTemplate));

        CommittedSummaryDto summary = recurringService.getCommittedSummary(testUser.getId());

        assertNotNull(summary);
        assertEquals("INR", summary.getCurrency());
        assertEquals(2, summary.getActiveTemplatesCount());
        // Rent (25000) + Netflix (649) = 25649.00
        assertEquals(new BigDecimal("25649.00"), summary.getTotalMonthlyCommitted());
        assertEquals(new BigDecimal("150000.00"), summary.getMonthlyIncome());
        // 25649 * 100 / 150000 = 17.10%
        assertNotNull(summary.getIncomeCommittedPercentage());
        assertEquals(17.10, summary.getIncomeCommittedPercentage(), 0.01);
    }

    @Test
    @DisplayName("Create recurring template assigns user, category, and saves correctly")
    void testCreateRecurringTemplate() {
        CreateRecurringRequest req = new CreateRecurringRequest();
        req.setDescription("Gym Membership");
        req.setCategoryId(entertainmentCategory.getId());
        req.setAmount(new BigDecimal("2000.00"));
        req.setCurrency("INR");
        req.setCadence(Cadence.MONTHLY);
        req.setNextDueDate(LocalDate.now().plusDays(5));

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findById(entertainmentCategory.getId())).thenReturn(Optional.of(entertainmentCategory));
        when(recurringRepository.save(any(RecurringExpenseTemplate.class))).thenAnswer(invocation -> {
            RecurringExpenseTemplate saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        RecurringTemplateDto dto = recurringService.createRecurringTemplate(testUser.getId(), req);

        assertNotNull(dto);
        assertEquals("Gym Membership", dto.getDescription());
        assertEquals(new BigDecimal("2000.00"), dto.getAmount());
        assertFalse(dto.isPaused());
    }

    @Test
    @DisplayName("Toggle pause flips active state to paused and back")
    void testTogglePause() {
        when(recurringRepository.findById(rentTemplate.getId())).thenReturn(Optional.of(rentTemplate));
        when(recurringRepository.save(any(RecurringExpenseTemplate.class))).thenAnswer(i -> i.getArgument(0));

        // First toggle: Active -> Paused
        assertFalse(rentTemplate.isPaused());
        RecurringTemplateDto pausedDto = recurringService.togglePause(testUser.getId(), rentTemplate.getId());
        assertTrue(pausedDto.isPaused());

        // Second toggle: Paused -> Active
        RecurringTemplateDto activeDto = recurringService.togglePause(testUser.getId(), rentTemplate.getId());
        assertFalse(activeDto.isPaused());
    }

    @Test
    @DisplayName("Process due charges delegates to scheduler")
    void testProcessDueChargesOnDemand() {
        when(recurringScheduler.processDueRecurringExpenses()).thenReturn(1);

        int count = recurringService.processDueChargesOnDemand();

        assertEquals(1, count);
        verify(recurringScheduler).processDueRecurringExpenses();
    }
}

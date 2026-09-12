package com.runway.service;

import com.runway.dto.SavingsGoalDto;
import com.runway.entity.GoalContribution;
import com.runway.entity.SavingsGoal;
import com.runway.entity.User;
import com.runway.repository.GoalContributionRepository;
import com.runway.repository.SavingsGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SavingsGoalServiceTest {

    @Mock
    private SavingsGoalRepository goalRepository;

    @Mock
    private GoalContributionRepository contributionRepository;

    @InjectMocks
    private SavingsGoalService savingsGoalService;

    private User testUser;
    private SavingsGoal testGoal;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@runway.app")
                .defaultCurrency("INR")
                .build();

        testGoal = SavingsGoal.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Emergency Fund")
                .targetAmount(new BigDecimal("10000.00"))
                .targetDate(LocalDate.now().plusMonths(6))
                .currency("INR")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void testMapToDto_SingleContributionLoggedToday_GuardsAgainstDivisionByZero() {
        // Single contribution created today
        GoalContribution contribution = GoalContribution.builder()
                .id(UUID.randomUUID())
                .goal(testGoal)
                .amount(new BigDecimal("2000.00"))
                .occurredAt(Instant.now()) // Today (0 days elapsed)
                .createdAt(Instant.now())
                .build();

        when(contributionRepository.findByGoalIdOrderByOccurredAtDesc(testGoal.getId()))
                .thenReturn(List.of(contribution));

        SavingsGoalDto dto = savingsGoalService.mapToDto(testGoal);

        assertNotNull(dto);
        assertEquals(new BigDecimal("2000.00"), dto.getCurrentSaved());
        assertEquals(20.0, dto.getPercentage());
        assertNotNull(dto.getEstimatedCompletionDate());
        // Remaining 8000 / daily rate (2000/30) = 120 days remaining -> Today + 120 days
        assertEquals(LocalDate.now().plusDays(120), dto.getEstimatedCompletionDate());
    }

    @Test
    void testMapToDto_NoContributions_ReturnsFallbackTargetDate() {
        when(contributionRepository.findByGoalIdOrderByOccurredAtDesc(testGoal.getId()))
                .thenReturn(Collections.emptyList());

        SavingsGoalDto dto = savingsGoalService.mapToDto(testGoal);

        assertNotNull(dto);
        assertEquals(BigDecimal.ZERO, dto.getCurrentSaved());
        assertEquals(0.0, dto.getPercentage());
        assertEquals(testGoal.getTargetDate(), dto.getEstimatedCompletionDate());
    }
}

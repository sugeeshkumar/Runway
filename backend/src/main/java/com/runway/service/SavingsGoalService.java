package com.runway.service;

import com.runway.dto.AddContributionRequest;
import com.runway.dto.CreateGoalRequest;
import com.runway.dto.GoalContributionDto;
import com.runway.dto.SavingsGoalDto;
import com.runway.entity.GoalContribution;
import com.runway.entity.SavingsGoal;
import com.runway.entity.User;
import com.runway.repository.GoalContributionRepository;
import com.runway.repository.SavingsGoalRepository;
import com.runway.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SavingsGoalService {

    private static final Logger log = LoggerFactory.getLogger(SavingsGoalService.class);

    private final SavingsGoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;
    private final UserRepository userRepository;

    public SavingsGoalService(SavingsGoalRepository goalRepository,
                              GoalContributionRepository contributionRepository,
                              UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalDto> getGoalsForUser(UUID userId) {
        List<SavingsGoal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return goals.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SavingsGoalDto getGoalById(UUID userId, UUID goalId) {
        SavingsGoal goal = getGoalOrThrow(goalId);
        validateOwner(goal, userId);
        return mapToDto(goal);
    }

    @Transactional
    public SavingsGoalDto createGoal(UUID userId, CreateGoalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(request.getName().trim())
                .targetAmount(request.getTargetAmount())
                .targetDate(request.getTargetDate())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .createdAt(Instant.now())
                .build();

        goal = goalRepository.save(goal);
        return mapToDto(goal);
    }

    @Transactional
    public SavingsGoalDto updateGoal(UUID userId, UUID goalId, CreateGoalRequest request) {
        SavingsGoal goal = getGoalOrThrow(goalId);
        validateOwner(goal, userId);

        goal.setName(request.getName().trim());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        if (request.getCurrency() != null) {
            goal.setCurrency(request.getCurrency());
        }

        goal = goalRepository.save(goal);
        return mapToDto(goal);
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID goalId) {
        SavingsGoal goal = getGoalOrThrow(goalId);
        validateOwner(goal, userId);
        goalRepository.delete(goal);
    }

    @Transactional
    public SavingsGoalDto addContribution(UUID userId, UUID goalId, AddContributionRequest request) {
        SavingsGoal goal = getGoalOrThrow(goalId);
        validateOwner(goal, userId);

        GoalContribution contribution = GoalContribution.builder()
                .goal(goal)
                .amount(request.getAmount())
                .occurredAt(request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now())
                .note(request.getNote())
                .build();

        contributionRepository.save(contribution);
        goal.getContributions().add(contribution);

        return mapToDto(goal);
    }

    @Transactional
    public SavingsGoalDto deleteContribution(UUID userId, UUID goalId, UUID contributionId) {
        SavingsGoal goal = getGoalOrThrow(goalId);
        validateOwner(goal, userId);

        GoalContribution contribution = contributionRepository.findById(contributionId)
                .orElseThrow(() -> new IllegalArgumentException("Contribution not found"));

        if (!contribution.getGoal().getId().equals(goalId)) {
            throw new IllegalArgumentException("Contribution does not belong to specified goal");
        }

        contributionRepository.delete(contribution);
        goal.getContributions().removeIf(c -> c.getId().equals(contributionId));

        return mapToDto(goal);
    }

    private SavingsGoal getGoalOrThrow(UUID goalId) {
        return goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Savings goal not found"));
    }

    private void validateOwner(SavingsGoal goal, UUID userId) {
        if (!goal.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized access to savings goal");
        }
    }

    public SavingsGoalDto mapToDto(SavingsGoal goal) {
        List<GoalContribution> contributions = contributionRepository.findByGoalIdOrderByOccurredAtDesc(goal.getId());

        BigDecimal currentSaved = contributions.stream()
                .map(GoalContribution::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double percentage = 0.0;
        if (goal.getTargetAmount() != null && goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = currentSaved.multiply(BigDecimal.valueOf(100))
                    .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP)
                    .doubleValue();
            if (percentage > 100.0) percentage = 100.0;
        }

        LocalDate estimatedCompletion = calculateEstimatedCompletionDate(goal.getTargetAmount(), currentSaved, contributions, goal.getTargetDate());

        List<GoalContributionDto> contribDtos = contributions.stream()
                .map(c -> GoalContributionDto.builder()
                        .id(c.getId())
                        .goalId(goal.getId())
                        .amount(c.getAmount())
                        .occurredAt(c.getOccurredAt())
                        .note(c.getNote())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return SavingsGoalDto.builder()
                .id(goal.getId())
                .userId(goal.getUser().getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .targetDate(goal.getTargetDate())
                .currency(goal.getCurrency())
                .currentSaved(currentSaved)
                .percentage(percentage)
                .estimatedCompletionDate(estimatedCompletion)
                .contributionsCount(contributions.size())
                .createdAt(goal.getCreatedAt())
                .contributions(contribDtos)
                .build();
    }

    private LocalDate calculateEstimatedCompletionDate(BigDecimal target, BigDecimal currentSaved, List<GoalContribution> contributions, LocalDate fallbackTargetDate) {
        if (target == null || target.compareTo(BigDecimal.ZERO) <= 0) {
            return fallbackTargetDate;
        }
        if (currentSaved.compareTo(target) >= 0) {
            return LocalDate.now(); // Goal already reached!
        }
        if (contributions == null || contributions.isEmpty()) {
            return fallbackTargetDate;
        }

        // Find earliest contribution date
        Instant earliest = contributions.stream()
                .map(GoalContribution::getOccurredAt)
                .min(Comparator.naturalOrder())
                .orElse(Instant.now());

        LocalDate firstDate = earliest.atZone(ZoneId.systemDefault()).toLocalDate();
        long daysElapsed = ChronoUnit.DAYS.between(firstDate, LocalDate.now());
        
        // Personal Finance Normalization:
        // Assume monthly contribution cycles. If less than 30 days have passed since first contribution,
        // normalize total saved against a 30-day baseline (1 month) to prevent over-estimating daily velocity.
        long effectiveDays = Math.max(30, daysElapsed);

        BigDecimal dailyRate = currentSaved.divide(BigDecimal.valueOf(effectiveDays), 4, RoundingMode.HALF_UP);
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            return fallbackTargetDate;
        }

        BigDecimal remaining = target.subtract(currentSaved);
        long daysRemaining = remaining.divide(dailyRate, 0, RoundingMode.CEILING).longValue();

        return LocalDate.now().plusDays(daysRemaining);
    }
}

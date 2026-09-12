package com.runway.repository;

import com.runway.entity.GoalContribution;
import com.runway.entity.SavingsGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalContributionRepository extends JpaRepository<GoalContribution, UUID> {
    List<GoalContribution> findByGoalOrderByOccurredAtDesc(SavingsGoal goal);
    List<GoalContribution> findByGoalIdOrderByOccurredAtDesc(UUID goalId);
}

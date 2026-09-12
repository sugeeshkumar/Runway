package com.runway.repository;

import com.runway.entity.SavingsGoal;
import com.runway.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, UUID> {
    List<SavingsGoal> findByUserOrderByCreatedAtDesc(User user);
    List<SavingsGoal> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

package com.runway.controller;

import com.runway.dto.AddContributionRequest;
import com.runway.dto.CreateGoalRequest;
import com.runway.dto.SavingsGoalDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.SavingsGoalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/goals")
public class SavingsGoalController {

    private final SavingsGoalService goalService;

    public SavingsGoalController(SavingsGoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<List<SavingsGoalDto>> getGoals(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<SavingsGoalDto> goals = goalService.getGoalsForUser(userDetails.getId());
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SavingsGoalDto> getGoalById(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id) {
        SavingsGoalDto goal = goalService.getGoalById(userDetails.getId(), id);
        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<SavingsGoalDto> createGoal(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateGoalRequest request) {
        SavingsGoalDto goal = goalService.createGoal(userDetails.getId(), request);
        return ResponseEntity.ok(goal);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoalDto> updateGoal(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody CreateGoalRequest request) {
        SavingsGoalDto goal = goalService.updateGoal(userDetails.getId(), id, request);
        return ResponseEntity.ok(goal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id) {
        goalService.deleteGoal(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contributions")
    public ResponseEntity<SavingsGoalDto> addContribution(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AddContributionRequest request) {
        SavingsGoalDto goal = goalService.addContribution(userDetails.getId(), id, request);
        return ResponseEntity.ok(goal);
    }

    @DeleteMapping("/{id}/contributions/{contributionId}")
    public ResponseEntity<SavingsGoalDto> deleteContribution(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id,
            @PathVariable UUID contributionId) {
        SavingsGoalDto goal = goalService.deleteContribution(userDetails.getId(), id, contributionId);
        return ResponseEntity.ok(goal);
    }
}

package com.runway.controller;

import com.runway.dto.BudgetDto;
import com.runway.dto.CreateBudgetRequest;
import com.runway.security.UserDetailsImpl;
import com.runway.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<List<BudgetDto>> getBudgets(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String month) {
        String periodMonth = (month != null && !month.isBlank()) ? month : YearMonth.now().toString();
        List<BudgetDto> budgets = budgetService.getBudgetsForUserAndMonth(userDetails.getId(), periodMonth);
        return ResponseEntity.ok(budgets);
    }

    @PostMapping
    public ResponseEntity<BudgetDto> createOrUpdateBudget(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateBudgetRequest request) {
        BudgetDto budget = budgetService.createOrUpdateBudget(userDetails.getId(), request);
        return ResponseEntity.ok(budget);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                             @PathVariable UUID id) {
        budgetService.deleteBudget(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}

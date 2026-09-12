package com.runway.controller;

import com.runway.dto.CreateExpenseRequest;
import com.runway.dto.ExpenseDto;
import com.runway.dto.UpdateExpenseRequest;
import com.runway.security.UserDetailsImpl;
import com.runway.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDto>> getExpenses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<ExpenseDto> expenses = expenseService.getExpensesForUser(userDetails.getId());
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<com.runway.dto.CalendarDaySpendDto>> getCalendarSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        List<com.runway.dto.CalendarDaySpendDto> summary = expenseService.getCalendarMonthSummary(userDetails.getId(), year, month);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/check-duplicate")
    public ResponseEntity<com.runway.dto.DuplicateCheckDto> checkDuplicate(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CreateExpenseRequest request) {
        com.runway.dto.DuplicateCheckDto result = expenseService.checkDuplicate(
                userDetails.getId(),
                request.getAmount(),
                request.getMerchant(),
                request.getDescription(),
                request.getCategoryId(),
                request.getOccurredAt()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<ExpenseDto> createExpense(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                    @Valid @RequestBody CreateExpenseRequest request) {
        ExpenseDto expense = expenseService.createExpense(userDetails.getId(), request);
        return ResponseEntity.ok(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDto> updateExpense(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                    @PathVariable UUID id,
                                                    @Valid @RequestBody UpdateExpenseRequest request) {
        ExpenseDto expense = expenseService.updateExpense(userDetails.getId(), id, request);
        return ResponseEntity.ok(expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                              @PathVariable UUID id) {
        expenseService.deleteExpense(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}

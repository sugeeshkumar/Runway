package com.runway.controller;

import com.runway.dto.*;
import com.runway.security.UserDetailsImpl;
import com.runway.service.SharedLedgerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ledgers")
public class SharedLedgerController {

    private final SharedLedgerService ledgerService;

    public SharedLedgerController(SharedLedgerService ledgerService) {
        this.ledgerService = ledgerService;
    }

    @GetMapping
    public ResponseEntity<List<SharedLedgerDto>> getAllLedgers(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<SharedLedgerDto> ledgers = ledgerService.getAllLedgersForUser(userDetails.getId());
        return ResponseEntity.ok(ledgers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SharedLedgerDto> getLedgerById(@PathVariable UUID id,
                                                         @AuthenticationPrincipal UserDetailsImpl userDetails) {
        SharedLedgerDto ledger = ledgerService.getLedgerById(id, userDetails.getId());
        return ResponseEntity.ok(ledger);
    }

    @PostMapping
    public ResponseEntity<SharedLedgerDto> createLedger(@Valid @RequestBody CreateLedgerRequest request,
                                                       @AuthenticationPrincipal UserDetailsImpl userDetails) {
        SharedLedgerDto ledger = ledgerService.createLedger(request, userDetails.getId());
        return ResponseEntity.ok(ledger);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SharedLedgerDto> updateLedger(@PathVariable UUID id,
                                                         @Valid @RequestBody CreateLedgerRequest request,
                                                         @AuthenticationPrincipal UserDetailsImpl userDetails) {
        SharedLedgerDto ledger = ledgerService.updateLedger(id, request, userDetails.getId());
        return ResponseEntity.ok(ledger);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLedger(@PathVariable UUID id,
                                             @AuthenticationPrincipal UserDetailsImpl userDetails) {
        ledgerService.deleteLedger(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<LedgerParticipantDto> addParticipant(@PathVariable UUID id,
                                                               @Valid @RequestBody AddParticipantRequest request,
                                                               @AuthenticationPrincipal UserDetailsImpl userDetails) {
        LedgerParticipantDto participant = ledgerService.addParticipant(id, request, userDetails.getId());
        return ResponseEntity.ok(participant);
    }

    @DeleteMapping("/{id}/participants/{participantId}")
    public ResponseEntity<Void> removeParticipant(@PathVariable UUID id,
                                                  @PathVariable UUID participantId,
                                                  @AuthenticationPrincipal UserDetailsImpl userDetails) {
        ledgerService.removeParticipant(id, participantId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<SharedExpenseDto>> getExpenses(@PathVariable UUID id,
                                                             @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<SharedExpenseDto> expenses = ledgerService.getExpensesForLedger(id, userDetails.getId());
        return ResponseEntity.ok(expenses);
    }

    @PostMapping("/{id}/expenses")
    public ResponseEntity<SharedExpenseDto> createExpense(@PathVariable UUID id,
                                                           @Valid @RequestBody CreateSharedExpenseRequest request,
                                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        SharedExpenseDto expense = ledgerService.createSharedExpense(id, request, userDetails.getId());
        return ResponseEntity.ok(expense);
    }

    @DeleteMapping("/{id}/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable UUID id,
                                              @PathVariable UUID expenseId,
                                              @AuthenticationPrincipal UserDetailsImpl userDetails) {
        ledgerService.deleteSharedExpense(id, expenseId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/balances")
    public ResponseEntity<LedgerBalancesDto> getBalances(@PathVariable UUID id,
                                                          @AuthenticationPrincipal UserDetailsImpl userDetails) {
        LedgerBalancesDto balances = ledgerService.getLedgerBalances(id, userDetails.getId());
        return ResponseEntity.ok(balances);
    }

    @PostMapping("/{id}/settle")
    public ResponseEntity<SharedLedgerDto> settleLedger(@PathVariable UUID id,
                                                         @RequestBody(required = false) SettleLedgerRequest request,
                                                         @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (request == null) {
            request = new SettleLedgerRequest(false, null);
        }
        SharedLedgerDto ledger = ledgerService.settleLedger(id, request, userDetails.getId());
        return ResponseEntity.ok(ledger);
    }
}

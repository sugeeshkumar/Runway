package com.runway.controller;

import com.runway.dto.CommittedSummaryDto;
import com.runway.dto.CreateRecurringRequest;
import com.runway.dto.RecurringTemplateDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.RecurringService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recurring")
public class RecurringController {

    private final RecurringService recurringService;

    public RecurringController(RecurringService recurringService) {
        this.recurringService = recurringService;
    }

    @GetMapping
    public ResponseEntity<List<RecurringTemplateDto>> getRecurringTemplates(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<RecurringTemplateDto> templates = recurringService.getRecurringTemplatesForUser(userDetails.getId());
        return ResponseEntity.ok(templates);
    }

    @GetMapping({"/summary", "/committed-summary"})
    public ResponseEntity<CommittedSummaryDto> getCommittedSummary(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        CommittedSummaryDto summary = recurringService.getCommittedSummary(userDetails.getId());
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<RecurringTemplateDto> createRecurringTemplate(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateRecurringRequest request) {
        RecurringTemplateDto template = recurringService.createRecurringTemplate(userDetails.getId(), request);
        return ResponseEntity.ok(template);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RecurringTemplateDto> updateStatus(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id,
            @RequestBody(required = false) com.runway.dto.UpdateRecurringStatusRequest request) {
        RecurringTemplateDto template = recurringService.updateStatus(userDetails.getId(), id, request);
        return ResponseEntity.ok(template);
    }

    @PutMapping("/{id}/toggle-pause")
    public ResponseEntity<RecurringTemplateDto> togglePausePut(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id) {
        RecurringTemplateDto template = recurringService.togglePause(userDetails.getId(), id);
        return ResponseEntity.ok(template);
    }

    @PatchMapping("/{id}/pause")
    public ResponseEntity<RecurringTemplateDto> togglePausePatch(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id) {
        RecurringTemplateDto template = recurringService.togglePause(userDetails.getId(), id);
        return ResponseEntity.ok(template);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringTemplateDto> updateRecurringTemplate(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody CreateRecurringRequest request) {
        RecurringTemplateDto template = recurringService.updateRecurringTemplate(userDetails.getId(), id, request);
        return ResponseEntity.ok(template);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringTemplate(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                        @PathVariable UUID id) {
        recurringService.deleteRecurringTemplate(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processDueCharges() {
        int generatedCount = recurringService.processDueChargesOnDemand();
        return ResponseEntity.ok(Map.of(
                "message", "Processed due recurring templates on demand",
                "generatedCharges", generatedCount
        ));
    }
}

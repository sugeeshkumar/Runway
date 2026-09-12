package com.runway.controller;

import com.runway.dto.InsightResponseDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.InsightService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightController {

    private final InsightService insightService;

    public InsightController(InsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping
    public ResponseEntity<InsightResponseDto> getInsights(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period) {
        InsightResponseDto response = insightService.generateInsights(userDetails.getId(), period);
        return ResponseEntity.ok(response);
    }
}

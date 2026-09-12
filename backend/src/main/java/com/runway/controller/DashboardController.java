package com.runway.controller;

import com.runway.dto.DashboardSummaryDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String month) {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary(userDetails.getId(), month);
        return ResponseEntity.ok(summary);
    }
}

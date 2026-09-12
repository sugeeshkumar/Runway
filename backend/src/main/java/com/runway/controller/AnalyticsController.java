package com.runway.controller;

import com.runway.dto.*;
import com.runway.security.UserDetailsImpl;
import com.runway.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/insights")
    public ResponseEntity<AnalyticsInsightsDto> getAnalyticsInsights(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "THIS_MONTH") String period,
            @RequestParam(defaultValue = "DAILY") String granularity) {
        AnalyticsInsightsDto insights = analyticsService.getAnalyticsInsights(userDetails.getId(), period, granularity);
        return ResponseEntity.ok(insights);
    }

    @GetMapping("/category-trends")
    public ResponseEntity<List<CategoryTrendDto>> getCategoryTrends(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "6") int months) {
        List<CategoryTrendDto> trends = analyticsService.getCategoryTrends(userDetails.getId(), months);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/day-of-week-heatmap")
    public ResponseEntity<List<DayOfWeekSpendDto>> getDayOfWeekHeatmap(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<DayOfWeekSpendDto> heatmap = analyticsService.getDayOfWeekHeatmap(userDetails.getId());
        return ResponseEntity.ok(heatmap);
    }

    @GetMapping("/month-over-month")
    public ResponseEntity<MonthOverMonthComparisonDto> getMonthOverMonth(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        MonthOverMonthComparisonDto mom = analyticsService.getMonthOverMonth(userDetails.getId());
        return ResponseEntity.ok(mom);
    }

    @GetMapping("/merchant-breakdown")
    public ResponseEntity<List<MerchantSpendDto>> getMerchantBreakdown(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "10") int limit) {
        List<MerchantSpendDto> merchants = analyticsService.getMerchantBreakdown(userDetails.getId(), limit);
        return ResponseEntity.ok(merchants);
    }
}

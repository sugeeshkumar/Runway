package com.runway.dto;

import java.util.List;

public class InsightResponseDto {
    private List<InsightDto> insights;
    private boolean hasEnoughData;
    private String currency;
    private String period;
    private String notice;

    public InsightResponseDto() {}

    public InsightResponseDto(List<InsightDto> insights, boolean hasEnoughData, String currency, String period, String notice) {
        this.insights = insights;
        this.hasEnoughData = hasEnoughData;
        this.currency = currency;
        this.period = period;
        this.notice = notice;
    }

    public static InsightResponseDtoBuilder builder() {
        return new InsightResponseDtoBuilder();
    }

    public static class InsightResponseDtoBuilder {
        private List<InsightDto> insights;
        private boolean hasEnoughData;
        private String currency;
        private String period;
        private String notice;

        public InsightResponseDtoBuilder insights(List<InsightDto> insights) { this.insights = insights; return this; }
        public InsightResponseDtoBuilder hasEnoughData(boolean hasEnoughData) { this.hasEnoughData = hasEnoughData; return this; }
        public InsightResponseDtoBuilder currency(String currency) { this.currency = currency; return this; }
        public InsightResponseDtoBuilder period(String period) { this.period = period; return this; }
        public InsightResponseDtoBuilder notice(String notice) { this.notice = notice; return this; }

        public InsightResponseDto build() {
            return new InsightResponseDto(insights, hasEnoughData, currency, period, notice);
        }
    }

    public List<InsightDto> getInsights() { return insights; }
    public void setInsights(List<InsightDto> insights) { this.insights = insights; }

    public boolean isHasEnoughData() { return hasEnoughData; }
    public void setHasEnoughData(boolean hasEnoughData) { this.hasEnoughData = hasEnoughData; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getNotice() { return notice; }
    public void setNotice(String notice) { this.notice = notice; }
}

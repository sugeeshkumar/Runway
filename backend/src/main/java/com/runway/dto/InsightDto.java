package com.runway.dto;

public class InsightDto {
    private String id;
    private InsightType type;
    private InsightSeverity severity;
    private String category;
    private String title;
    private String description;
    private String metric;
    private Double value;
    private String period;
    private double impactScore;

    public InsightDto() {}

    public InsightDto(String id, InsightType type, InsightSeverity severity, String category, String title, String description, String metric, Double value, String period, double impactScore) {
        this.id = id;
        this.type = type;
        this.severity = severity;
        this.category = category;
        this.title = title;
        this.description = description;
        this.metric = metric;
        this.value = value;
        this.period = period;
        this.impactScore = impactScore;
    }

    public static InsightDtoBuilder builder() {
        return new InsightDtoBuilder();
    }

    public static class InsightDtoBuilder {
        private String id;
        private InsightType type;
        private InsightSeverity severity;
        private String category;
        private String title;
        private String description;
        private String metric;
        private Double value;
        private String period;
        private double impactScore;

        public InsightDtoBuilder id(String id) { this.id = id; return this; }
        public InsightDtoBuilder type(InsightType type) { this.type = type; return this; }
        public InsightDtoBuilder severity(InsightSeverity severity) { this.severity = severity; return this; }
        public InsightDtoBuilder category(String category) { this.category = category; return this; }
        public InsightDtoBuilder title(String title) { this.title = title; return this; }
        public InsightDtoBuilder description(String description) { this.description = description; return this; }
        public InsightDtoBuilder metric(String metric) { this.metric = metric; return this; }
        public InsightDtoBuilder value(Double value) { this.value = value; return this; }
        public InsightDtoBuilder period(String period) { this.period = period; return this; }
        public InsightDtoBuilder impactScore(double impactScore) { this.impactScore = impactScore; return this; }

        public InsightDto build() {
            return new InsightDto(id, type, severity, category, title, description, metric, value, period, impactScore);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public InsightType getType() { return type; }
    public void setType(InsightType type) { this.type = type; }

    public InsightSeverity getSeverity() { return severity; }
    public void setSeverity(InsightSeverity severity) { this.severity = severity; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public double getImpactScore() { return impactScore; }
    public void setImpactScore(double impactScore) { this.impactScore = impactScore; }
}

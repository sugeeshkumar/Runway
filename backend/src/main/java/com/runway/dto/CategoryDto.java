package com.runway.dto;

import java.util.UUID;

public class CategoryDto {
    private UUID id;
    private UUID userId;
    private String name;
    private UUID parentId;
    private String color;

    public CategoryDto() {}

    public CategoryDto(UUID id, UUID userId, String name, UUID parentId, String color) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.parentId = parentId;
        this.color = color;
    }

    public static CategoryDtoBuilder builder() {
        return new CategoryDtoBuilder();
    }

    public static class CategoryDtoBuilder {
        private UUID id;
        private UUID userId;
        private String name;
        private UUID parentId;
        private String color;

        public CategoryDtoBuilder id(UUID id) { this.id = id; return this; }
        public CategoryDtoBuilder userId(UUID userId) { this.userId = userId; return this; }
        public CategoryDtoBuilder name(String name) { this.name = name; return this; }
        public CategoryDtoBuilder parentId(UUID parentId) { this.parentId = parentId; return this; }
        public CategoryDtoBuilder color(String color) { this.color = color; return this; }

        public CategoryDto build() { return new CategoryDto(id, userId, name, parentId, color); }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}

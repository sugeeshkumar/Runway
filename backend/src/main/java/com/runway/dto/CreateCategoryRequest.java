package com.runway.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class CreateCategoryRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private UUID parentId;

    private String color = "#64748B";

    public CreateCategoryRequest() {}

    public CreateCategoryRequest(String name, UUID parentId, String color) {
        this.name = name;
        this.parentId = parentId;
        this.color = color != null ? color : "#64748B";
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}

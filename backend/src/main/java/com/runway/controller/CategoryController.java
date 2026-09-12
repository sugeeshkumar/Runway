package com.runway.controller;

import com.runway.dto.CategoryDto;
import com.runway.dto.CreateCategoryRequest;
import com.runway.security.UserDetailsImpl;
import com.runway.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getCategories(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<CategoryDto> categories = categoryService.getCategoriesForUser(userDetails.getId());
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                      @Valid @RequestBody CreateCategoryRequest request) {
        CategoryDto category = categoryService.createCategory(userDetails.getId(), request);
        return ResponseEntity.ok(category);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                      @PathVariable UUID id,
                                                      @Valid @RequestBody CreateCategoryRequest request) {
        CategoryDto category = categoryService.updateCategory(userDetails.getId(), id, request);
        return ResponseEntity.ok(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                               @PathVariable UUID id,
                                               @RequestParam(required = false) UUID reassignTo) {
        categoryService.deleteCategory(userDetails.getId(), id, reassignTo);
        return ResponseEntity.noContent().build();
    }
}

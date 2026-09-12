package com.runway.service;

import com.runway.dto.CategoryDto;
import com.runway.dto.CreateCategoryRequest;
import com.runway.entity.Category;
import com.runway.entity.User;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.BudgetRepository;
import com.runway.repository.RecurringRepository;
import com.runway.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringRepository recurringRepository;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository, ExpenseRepository expenseRepository, BudgetRepository budgetRepository, RecurringRepository recurringRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.recurringRepository = recurringRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getCategoriesForUser(UUID userId) {
        return categoryRepository.findAllAvailableForUser(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public CategoryDto createCategory(UUID userId, CreateCategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));
            if (parent.getUser() != null && !parent.getUser().getId().equals(userId)) {
                throw new IllegalStateException("Unauthorized parent category access");
            }
        }

        Category category = Category.builder()
                .user(user)
                .name(request.getName().trim())
                .parent(parent)
                .color(request.getColor() != null ? request.getColor() : "#64748B")
                .build();

        category = categoryRepository.save(category);
        return mapToDto(category);
    }

    @Transactional
    public CategoryDto updateCategory(UUID userId, UUID id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to update this category");
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent category not found"));
            if (parent.getUser() != null && !parent.getUser().getId().equals(userId)) {
                throw new IllegalStateException("Unauthorized parent category access");
            }
        }

        category.setName(request.getName().trim());
        category.setParent(parent);
        if (request.getColor() != null) category.setColor(request.getColor());

        category = categoryRepository.save(category);
        return mapToDto(category);
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID categoryId, UUID reassignToCategoryId) {
        Category categoryToDelete = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (categoryToDelete.getUser() != null && !categoryToDelete.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this category");
        }

        // Find reassign target category
        UUID targetId = reassignToCategoryId;
        if (targetId == null) {
            // Default fallback to any other available category for the user
            List<Category> available = categoryRepository.findAllAvailableForUser(userId);
            targetId = available.stream()
                    .filter(c -> !c.getId().equals(categoryId))
                    .map(Category::getId)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Cannot delete sole category without a target reassign category"));
        }

        Category targetCategory = categoryRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Reassignment category not found"));

        // Reassign expenses, budgets, recurring templates
        List<com.runway.entity.Expense> expensesToReassign = expenseRepository.findByUserIdOrderByOccurredAtDesc(userId)
                .stream()
                .filter(e -> e.getCategory().getId().equals(categoryId))
                .toList();

        for (com.runway.entity.Expense expense : expensesToReassign) {
            expense.setCategory(targetCategory);
            expenseRepository.save(expense);
        }

        List<com.runway.entity.Budget> budgetsToReassign = budgetRepository.findByUserIdAndPeriodMonth(userId, java.time.YearMonth.now().toString())
                .stream()
                .filter(b -> b.getCategory() != null && b.getCategory().getId().equals(categoryId))
                .toList();

        for (com.runway.entity.Budget budget : budgetsToReassign) {
            budget.setCategory(targetCategory);
            budgetRepository.save(budget);
        }

        List<com.runway.entity.RecurringExpenseTemplate> recurringToReassign = recurringRepository.findByUserIdOrderByNextDueDateAsc(userId)
                .stream()
                .filter(r -> r.getCategory().getId().equals(categoryId))
                .toList();

        for (com.runway.entity.RecurringExpenseTemplate r : recurringToReassign) {
            r.setCategory(targetCategory);
            recurringRepository.save(r);
        }

        // Delete original category
        categoryRepository.delete(categoryToDelete);
    }

    public CategoryDto mapToDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .name(c.getName())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .color(c.getColor())
                .build();
    }
}

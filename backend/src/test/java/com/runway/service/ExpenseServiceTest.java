package com.runway.service;

import com.runway.dto.CreateExpenseRequest;
import com.runway.dto.DuplicateCheckDto;
import com.runway.dto.ExpenseDto;
import com.runway.dto.UpdateExpenseRequest;
import com.runway.entity.Category;
import com.runway.entity.Expense;
import com.runway.entity.User;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import com.runway.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private ExpenseService expenseService;

    private User testUser;
    private User otherUser;
    private Category userCategory;
    private Category otherCategory;
    private Category systemCategory;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("user1@runway.app")
                .defaultCurrency("USD")
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .email("user2@runway.app")
                .defaultCurrency("USD")
                .build();

        userCategory = Category.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Dining")
                .color("#F97316")
                .build();

        otherCategory = Category.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .name("Private Dining")
                .color("#000000")
                .build();

        systemCategory = Category.builder()
                .id(UUID.randomUUID())
                .user(null) // System default category
                .name("General")
                .color("#64748B")
                .build();
    }

    @Test
    void createExpense_ValidUserCategory_Success() {
        CreateExpenseRequest request = new CreateExpenseRequest();
        request.setAmount(new BigDecimal("45.50"));
        request.setCategoryId(userCategory.getId());
        request.setMerchant("Zaitoon");
        request.setDescription("Dinner with team");

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findById(userCategory.getId())).thenReturn(Optional.of(userCategory));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense saved = invocation.getArgument(0);
            return new Expense(UUID.randomUUID(), saved.getUser(), saved.getAmount(), saved.getCurrency(),
                    saved.getCategory(), saved.getMerchant(), saved.getDescription(), saved.getOccurredAt(),
                    saved.getSource(), saved.getRawInput(), Instant.now());
        });

        ExpenseDto dto = expenseService.createExpense(testUser.getId(), request);

        assertNotNull(dto);
        assertEquals(new BigDecimal("45.50"), dto.getAmount());
        assertEquals("Zaitoon", dto.getMerchant());
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void createExpense_OtherUserCategory_ThrowsIllegalStateException() {
        CreateExpenseRequest request = new CreateExpenseRequest();
        request.setAmount(new BigDecimal("100.00"));
        request.setCategoryId(otherCategory.getId());

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(categoryRepository.findById(otherCategory.getId())).thenReturn(Optional.of(otherCategory));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                expenseService.createExpense(testUser.getId(), request)
        );

        assertEquals("Unauthorized category access", ex.getMessage());
        verify(expenseRepository, never()).save(any());
    }

    @Test
    void updateExpense_UnauthorizedUser_ThrowsIllegalStateException() {
        Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .amount(new BigDecimal("20.00"))
                .category(systemCategory)
                .build();

        UpdateExpenseRequest request = new UpdateExpenseRequest();
        request.setAmount(new BigDecimal("30.00"));
        request.setCategoryId(systemCategory.getId());

        when(expenseRepository.findById(expense.getId())).thenReturn(Optional.of(expense));

        assertThrows(IllegalStateException.class, () ->
                expenseService.updateExpense(testUser.getId(), expense.getId(), request)
        );
    }

    @Test
    void deleteExpense_UnauthorizedUser_ThrowsIllegalStateException() {
        Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(otherUser)
                .build();

        when(expenseRepository.findById(expense.getId())).thenReturn(Optional.of(expense));

        assertThrows(IllegalStateException.class, () ->
                expenseService.deleteExpense(testUser.getId(), expense.getId())
        );

        verify(expenseRepository, never()).delete(any());
    }

    @Test
    void checkDuplicate_RecentMatchingExpense_ReturnsTrue() {
        Instant now = Instant.now();
        Expense existingExpense = Expense.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("450.00"))
                .merchant("Zaitoon")
                .category(userCategory)
                .occurredAt(now.minus(2, ChronoUnit.MINUTES))
                .build();

        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(existingExpense));

        DuplicateCheckDto result = expenseService.checkDuplicate(
                testUser.getId(),
                new BigDecimal("450.00"),
                "Zaitoon",
                "Dinner",
                userCategory.getId(),
                now
        );

        assertTrue(result.isDuplicate());
        assertNotNull(result.getExistingExpenseId());
    }

    @Test
    void checkDuplicate_DifferentAmount_ReturnsFalse() {
        Instant now = Instant.now();
        Expense existingExpense = Expense.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .amount(new BigDecimal("200.00"))
                .merchant("Zaitoon")
                .category(userCategory)
                .occurredAt(now.minus(2, ChronoUnit.MINUTES))
                .build();

        when(expenseRepository.findByUserIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(testUser.getId()), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(existingExpense));

        DuplicateCheckDto result = expenseService.checkDuplicate(
                testUser.getId(),
                new BigDecimal("450.00"),
                "Zaitoon",
                "Dinner",
                userCategory.getId(),
                now
        );

        assertFalse(result.isDuplicate());
    }
}

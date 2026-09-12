package com.runway.service;

import com.runway.dto.ParsedExpenseDraftDto;
import com.runway.entity.Category;
import com.runway.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class NlpParserServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private NlpParserService nlpParserService;

    private Category diningCategory;
    private Category transportCategory;
    private Category groceriesCategory;

    @BeforeEach
    void setUp() {
        diningCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Dining & Food")
                .color("#F97316")
                .build();

        transportCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Transportation")
                .color("#3B82F6")
                .build();

        groceriesCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Groceries")
                .color("#10B981")
                .build();
    }

    @Test
    void parseExpenseText_DinnerAtZaitoon_ExtractsAmountMerchantAndHighConfidence() {
        UUID userId = UUID.randomUUID();
        when(categoryRepository.findAllAvailableForUser(userId))
                .thenReturn(List.of(diningCategory, transportCategory, groceriesCategory));

        ParsedExpenseDraftDto result = nlpParserService.parseText(userId, "Spent 450 on dinner at Zaitoon");

        assertNotNull(result);
        assertEquals(new BigDecimal("450"), result.getAmount());
        assertEquals("Zaitoon", result.getMerchant());
        assertEquals(diningCategory.getId(), result.getCategoryId());
        assertTrue(result.getConfidence() >= 0.80, "Expected high confidence for structured natural language input");
    }

    @Test
    void parseExpenseText_UberThisMorning_ExtractsTransportAndTodayDate() {
        UUID userId = UUID.randomUUID();
        when(categoryRepository.findAllAvailableForUser(userId))
                .thenReturn(List.of(diningCategory, transportCategory, groceriesCategory));

        ParsedExpenseDraftDto result = nlpParserService.parseText(userId, "Uber 280 this morning");

        assertNotNull(result);
        assertEquals(new BigDecimal("280"), result.getAmount());
        assertEquals("Uber", result.getMerchant());
        assertEquals(transportCategory.getId(), result.getCategoryId());

        LocalDate expectedDate = LocalDate.now();
        LocalDate actualDate = result.getOccurredAt().atZone(ZoneId.systemDefault()).toLocalDate();
        assertEquals(expectedDate, actualDate);
    }

    @Test
    void parseExpenseText_GroceriesYesterday_ExtractsYesterdayDate() {
        UUID userId = UUID.randomUUID();
        when(categoryRepository.findAllAvailableForUser(userId))
                .thenReturn(List.of(diningCategory, transportCategory, groceriesCategory));

        ParsedExpenseDraftDto result = nlpParserService.parseText(userId, "Paid 1200 for groceries yesterday");

        assertNotNull(result);
        assertEquals(new BigDecimal("1200"), result.getAmount());
        assertEquals(groceriesCategory.getId(), result.getCategoryId());
        assertEquals("Groceries", result.getCategoryName());

        LocalDate expectedDate = LocalDate.now().minusDays(1);
        LocalDate actualDate = result.getOccurredAt().atZone(ZoneId.systemDefault()).toLocalDate();
        assertEquals(expectedDate, actualDate);
    }
}

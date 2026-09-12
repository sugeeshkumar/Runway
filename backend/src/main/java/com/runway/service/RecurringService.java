package com.runway.service;

import com.runway.dto.CommittedSummaryDto;
import com.runway.dto.CreateRecurringRequest;
import com.runway.dto.RecurringTemplateDto;
import com.runway.entity.Cadence;
import com.runway.entity.Category;
import com.runway.entity.RecurringExpenseTemplate;
import com.runway.entity.User;
import com.runway.repository.CategoryRepository;
import com.runway.repository.RecurringRepository;
import com.runway.repository.UserRepository;
import com.runway.scheduler.RecurringScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class RecurringService {

    private final RecurringRepository recurringRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final RecurringScheduler recurringScheduler;

    public RecurringService(RecurringRepository recurringRepository,
                            UserRepository userRepository,
                            CategoryRepository categoryRepository,
                            CategoryService categoryService,
                            RecurringScheduler recurringScheduler) {
        this.recurringRepository = recurringRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
        this.recurringScheduler = recurringScheduler;
    }

    @Transactional(readOnly = true)
    public List<RecurringTemplateDto> getRecurringTemplatesForUser(UUID userId) {
        return recurringRepository.findByUserIdOrderByNextDueDateAsc(userId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommittedSummaryDto getCommittedSummary(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<RecurringExpenseTemplate> templates = recurringRepository.findByUserIdOrderByNextDueDateAsc(userId);

        BigDecimal totalMonthlyCommitted = BigDecimal.ZERO;
        int activeCount = 0;

        for (RecurringExpenseTemplate t : templates) {
            if (!t.isPaused()) {
                activeCount++;
                BigDecimal monthlyEquivalent = convertToMonthlyAmount(t.getAmount(), t.getCadence());
                totalMonthlyCommitted = totalMonthlyCommitted.add(monthlyEquivalent);
            }
        }

        BigDecimal income = user.getMonthlyIncome();
        Double percentage = null;
        if (income != null && income.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalMonthlyCommitted.multiply(BigDecimal.valueOf(100))
                    .divide(income, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return new CommittedSummaryDto(
                totalMonthlyCommitted.setScale(2, RoundingMode.HALF_UP),
                income,
                percentage,
                activeCount,
                user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR"
        );
    }

    @Transactional
    public RecurringTemplateDto createRecurringTemplate(UUID userId, CreateRecurringRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized category access");
        }

        RecurringExpenseTemplate template = RecurringExpenseTemplate.builder()
                .user(user)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : user.getDefaultCurrency())
                .category(category)
                .cadence(request.getCadence())
                .nextDueDate(request.getNextDueDate())
                .description(request.getDescription())
                .isPaused(false)
                .build();

        template = recurringRepository.save(template);
        return mapToDto(template);
    }

    @Transactional
    public RecurringTemplateDto updateRecurringTemplate(UUID userId, UUID id, CreateRecurringRequest request) {
        RecurringExpenseTemplate template = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (!template.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to update this template");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized category access");
        }

        template.setAmount(request.getAmount());
        if (request.getCurrency() != null) {
            template.setCurrency(request.getCurrency());
        }
        template.setCategory(category);
        template.setCadence(request.getCadence());
        template.setNextDueDate(request.getNextDueDate());
        template.setDescription(request.getDescription());

        template = recurringRepository.save(template);
        return mapToDto(template);
    }

    @Transactional
    public RecurringTemplateDto togglePause(UUID userId, UUID id) {
        RecurringExpenseTemplate template = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (!template.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to modify this template");
        }

        template.setPaused(!template.isPaused());
        template = recurringRepository.save(template);
        return mapToDto(template);
    }

    @Transactional
    public RecurringTemplateDto updateStatus(UUID userId, UUID id, com.runway.dto.UpdateRecurringStatusRequest request) {
        RecurringExpenseTemplate template = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (!template.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to modify this template");
        }

        if (request != null && request.getIsPaused() != null) {
            template.setPaused(request.getIsPaused());
        } else if (request != null && request.getStatus() != null) {
            template.setPaused("PAUSED".equalsIgnoreCase(request.getStatus()));
        } else {
            template.setPaused(!template.isPaused());
        }
        template = recurringRepository.save(template);
        return mapToDto(template);
    }

    @Transactional
    public void deleteRecurringTemplate(UUID userId, UUID id) {
        RecurringExpenseTemplate template = recurringRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (!template.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this template");
        }

        recurringRepository.delete(template);
    }

    @Transactional
    public int processDueChargesOnDemand() {
        return recurringScheduler.processDueRecurringExpenses();
    }

    private BigDecimal convertToMonthlyAmount(BigDecimal amount, Cadence cadence) {
        if (amount == null) return BigDecimal.ZERO;
        if (cadence == null) return amount;
        return switch (cadence) {
            case DAILY -> amount.multiply(BigDecimal.valueOf(30));
            case WEEKLY -> amount.multiply(BigDecimal.valueOf(4.333333));
            case MONTHLY -> amount;
            case YEARLY -> amount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        };
    }

    public RecurringTemplateDto mapToDto(RecurringExpenseTemplate t) {
        return RecurringTemplateDto.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .category(categoryService.mapToDto(t.getCategory()))
                .cadence(t.getCadence())
                .nextDueDate(t.getNextDueDate())
                .description(t.getDescription())
                .isPaused(t.isPaused())
                .build();
    }
}

package com.runway.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.runway.dto.ParsedExpenseDraftDto;
import com.runway.entity.Category;
import com.runway.entity.Expense;
import com.runway.repository.CategoryRepository;
import com.runway.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class NlpParserService {

    private static final Logger log = LoggerFactory.getLogger(NlpParserService.class);

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public NlpParserService(CategoryRepository categoryRepository,
                            ExpenseRepository expenseRepository) {
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    private static final Map<String, List<String>> CATEGORY_SYNONYMS = Map.of(
            "Dining & Food", List.of("lunch", "dinner", "breakfast", "coffee", "restaurant", "food", "cafe", "pizza", "burger", "starbucks", "swiggy", "zomato", "doordash", "ubereats", "meal", "snack", "biryani", "zaitoon", "subway", "kfc", "mcdonalds", "dominos"),
            "Groceries", List.of("groceries", "grocery", "supermarket", "walmart", "wholefoods", "target", "milk", "vegetables", "fruits", "zepto", "blinkit", "instacart", "provisions"),
            "Housing & Rent", List.of("rent", "lease", "mortgage", "housing", "maintenance"),
            "Utilities", List.of("utility", "utilities", "electric", "electricity", "water", "gas", "wifi", "internet", "broadband", "phone", "mobile", "recharge"),
            "Transportation", List.of("uber", "cab", "taxi", "lyft", "ola", "fuel", "petrol", "diesel", "gasoline", "metro", "bus", "train", "parking", "toll", "auto", "flight"),
            "Subscriptions", List.of("netflix", "spotify", "apple", "prime", "hulu", "youtube", "chatgpt", "github", "subscription", "cloud", "icloud"),
            "Entertainment", List.of("movie", "cinema", "concert", "game", "steam", "bowling", "drinks", "bar", "pub", "club", "party"),
            "Personal & Health", List.of("doctor", "pharmacy", "medicine", "gym", "badminton", "fitness", "yoga", "haircut", "salon", "spa", "clothes", "clothing", "dress", "dresses", "shirt", "pants", "shoes", "wear", "apparel", "shopping", "skincare", "suit", "jacket", "coat", "jeans", "top", "saree", "kurta", "outfit", "attire", "footwear", "headphones", "headphone", "earphones", "gadgets", "electronics", "amazon", "flipkart")
    );

    private static final List<String> KNOWN_BRANDS = List.of(
            "Zaitoon", "Starbucks", "Uber", "Ola", "Swiggy", "Zomato", "Amazon", "Flipkart",
            "Netflix", "Spotify", "Zepto", "Blinkit", "McDonalds", "Subway", "KFC", "Dominos", "Walmart", "Target"
    );

    public ParsedExpenseDraftDto parseText(UUID userId, String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return ParsedExpenseDraftDto.builder()
                    .rawInput(rawText)
                    .confidence(0.0)
                    .occurredAt(Instant.now())
                    .currency("USD")
                    .build();
        }

        String input = rawText.trim();
        List<Category> userCategories = categoryRepository.findAllAvailableForUser(userId);

        // 1. Detect Currency
        String currency = "USD";
        if (input.contains("₹") || Pattern.compile("(?i)\\b(inr|rs|rupees)\\b").matcher(input).find()) {
            currency = "INR";
        } else if (input.contains("€") || Pattern.compile("(?i)\\b(eur|euro|euros)\\b").matcher(input).find()) {
            currency = "EUR";
        } else if (input.contains("£") || Pattern.compile("(?i)\\b(gbp|pound|pounds)\\b").matcher(input).find()) {
            currency = "GBP";
        } else if (input.contains("$") || Pattern.compile("(?i)\\b(usd|dollar|dollars)\\b").matcher(input).find()) {
            currency = "USD";
        }

        // 2. Detect Amount
        BigDecimal amount = BigDecimal.ZERO;
        String textWithoutAmount = input;

        Pattern amountPattern = Pattern.compile("(?:[₹$€£]|INR|USD|EUR|GBP)?\\s*(\\d+(?:,\\d{3})*(?:\\.\\d{1,2})?)");
        Matcher amountMatcher = amountPattern.matcher(input);

        if (amountMatcher.find()) {
            String rawAmountStr = amountMatcher.group(1).replace(",", "");
            try {
                amount = new BigDecimal(rawAmountStr);
                textWithoutAmount = input.substring(0, amountMatcher.start()) + input.substring(amountMatcher.end());
            } catch (Exception ignored) {}
        }

        // 3. Detect Natural Language Date/Time
        Instant occurredAt = parseNaturalDate(input);

        String cleanedText = textWithoutAmount
                .replaceAll("[₹$€£]", "")
                .replaceAll("(?i)\\b(inr|usd|eur|gbp|rs|rupees|dollars|euros|pounds)\\b", "")
                .replaceAll("(?i)\\b(today|yesterday|this morning|last night|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|last friday|this morning)\\b", "")
                .replaceAll("\\s+", " ")
                .trim();

        // 4. Detect Merchant
        String merchant = null;
        for (String brand : KNOWN_BRANDS) {
            if (Pattern.compile("(?i)\\b" + Pattern.quote(brand) + "\\b").matcher(input).find()) {
                merchant = brand;
                break;
            }
        }

        if (merchant == null) {
            Pattern merchantPattern = Pattern.compile("(?i)\\b(?:at|from|via)\\s+([A-Za-z0-9\\s'&]+)");
            Matcher merchantMatcher = merchantPattern.matcher(cleanedText);
            if (merchantMatcher.find()) {
                merchant = merchantMatcher.group(1).trim();
                merchant = merchant.split("(?i)\\b(with|for|on|and|this|today|yesterday|last)\\b")[0].trim();
            }
        }

        // 5. Match Category (Rule-Based)
        Category bestCategoryMatch = null;
        double confidence = 0.50;
        String lowerInput = input.toLowerCase();

        for (Category cat : userCategories) {
            if (lowerInput.contains(cat.getName().toLowerCase())) {
                bestCategoryMatch = cat;
                confidence = 0.90;
                break;
            }
        }

        if (bestCategoryMatch == null) {
            for (Map.Entry<String, List<String>> entry : CATEGORY_SYNONYMS.entrySet()) {
                String catName = entry.getKey();
                for (String keyword : entry.getValue()) {
                    if (Pattern.compile("(?i)\\b" + Pattern.quote(keyword) + "\\b").matcher(lowerInput).find()) {
                        bestCategoryMatch = userCategories.stream()
                                .filter(c -> c.getName().equalsIgnoreCase(catName))
                                .findFirst()
                                .orElse(null);
                        if (bestCategoryMatch != null) {
                            confidence = 0.85;
                            break;
                        }
                    }
                }
                if (bestCategoryMatch != null) break;
            }
        }

        // 6. Check Merchant Historical Memory (Learned Corrections)
        if (bestCategoryMatch == null || confidence < 0.80) {
            List<Expense> pastExpenses = expenseRepository.findByUserIdOrderByOccurredAtDesc(userId);
            for (Expense past : pastExpenses) {
                if (past.getMerchant() != null && !past.getMerchant().isBlank()) {
                    if (lowerInput.contains(past.getMerchant().toLowerCase())) {
                        bestCategoryMatch = past.getCategory();
                        if (merchant == null) merchant = past.getMerchant();
                        confidence = 0.90; // High confidence from learned history!
                        break;
                    }
                }
            }
        }

        // If we found amount > 0 and a valid category, boost confidence to high
        if (amount.compareTo(BigDecimal.ZERO) > 0 && bestCategoryMatch != null && confidence >= 0.70) {
            confidence = 0.85;
        }

        // 7. LLM Fallback (if rule-based confidence < 0.80)
        if (confidence < 0.80 || amount.compareTo(BigDecimal.ZERO) == 0 || bestCategoryMatch == null) {
            ParsedExpenseDraftDto llmDraft = tryLlmFallback(input, userCategories, amount, currency, merchant, cleanedText);
            if (llmDraft != null) {
                return llmDraft;
            }
        }

        if (bestCategoryMatch == null && !userCategories.isEmpty()) {
            bestCategoryMatch = userCategories.get(0);
            confidence = (amount.compareTo(BigDecimal.ZERO) > 0) ? 0.60 : 0.30;
        }

        String description = cleanedText.isBlank()
                ? (merchant != null ? merchant : (bestCategoryMatch != null ? bestCategoryMatch.getName() : "Expense"))
                : cleanedText;

        return ParsedExpenseDraftDto.builder()
                .amount(amount)
                .currency(currency)
                .categoryId(bestCategoryMatch != null ? bestCategoryMatch.getId() : null)
                .categoryName(bestCategoryMatch != null ? bestCategoryMatch.getName() : "Uncategorized")
                .merchant(merchant)
                .description(description)
                .confidence(confidence)
                .occurredAt(occurredAt)
                .rawInput(input)
                .build();
    }

    private Instant parseNaturalDate(String input) {
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zoneId);
        String lower = input.toLowerCase();

        if (lower.contains("yesterday")) {
            return today.minusDays(1).atTime(12, 0).atZone(zoneId).toInstant();
        } else if (lower.contains("last night") || lower.contains("tonight")) {
            return today.minusDays(1).atTime(20, 0).atZone(zoneId).toInstant();
        } else if (lower.contains("this morning") || lower.contains("morning")) {
            return today.atTime(9, 0).atZone(zoneId).toInstant();
        }

        // Weekdays
        DayOfWeek targetDow = null;
        if (lower.contains("monday")) targetDow = DayOfWeek.MONDAY;
        else if (lower.contains("tuesday")) targetDow = DayOfWeek.TUESDAY;
        else if (lower.contains("wednesday")) targetDow = DayOfWeek.WEDNESDAY;
        else if (lower.contains("thursday")) targetDow = DayOfWeek.THURSDAY;
        else if (lower.contains("friday")) targetDow = DayOfWeek.FRIDAY;
        else if (lower.contains("saturday")) targetDow = DayOfWeek.SATURDAY;
        else if (lower.contains("sunday")) targetDow = DayOfWeek.SUNDAY;

        if (targetDow != null) {
            LocalDate dateIter = today;
            if (dateIter.getDayOfWeek() == targetDow) {
                dateIter = dateIter.minusDays(7);
            } else {
                while (dateIter.getDayOfWeek() != targetDow) {
                    dateIter = dateIter.minusDays(1);
                }
            }
            return dateIter.atTime(12, 0).atZone(zoneId).toInstant();
        }

        return Instant.now();
    }

    private ParsedExpenseDraftDto tryLlmFallback(String rawText, List<Category> availableCategories, BigDecimal ruleAmount, String ruleCurrency, String ruleMerchant, String cleanedText) {
        String apiKey = System.getenv("ANTHROPIC_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("CLAUDE_API_KEY");
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.debug("No Claude API key provided; skipping LLM fallback.");
            return null;
        }

        try {
            List<String> catNames = availableCategories.stream().map(Category::getName).collect(Collectors.toList());
            String prompt = String.format(
                    "You are an expense text parser. Parse this text: \"%s\". Available categories: %s. Output ONLY a valid JSON object matching this schema: {\"amount\": number, \"currency\": string, \"categoryName\": string, \"merchant\": string or null, \"description\": string}. No extra text or markdown codeblocks.",
                    rawText.replace("\"", "\\\""), catNames
            );

            Map<String, Object> body = Map.of(
                    "model", "claude-3-5-haiku-20241022",
                    "max_tokens", 300,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            String requestJson = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .timeout(Duration.ofSeconds(4))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode contentArray = root.get("content");
                if (contentArray != null && contentArray.isArray() && contentArray.size() > 0) {
                    String jsonText = contentArray.get(0).get("text").asText().trim();

                    // Strip markdown fences if present
                    if (jsonText.startsWith("```")) {
                        jsonText = jsonText.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("\\n?```$", "").trim();
                    }

                    JsonNode parsed = objectMapper.readTree(jsonText);
                    BigDecimal amount = parsed.has("amount") ? new BigDecimal(parsed.get("amount").asText()) : ruleAmount;
                    String currency = parsed.has("currency") ? parsed.get("currency").asText() : ruleCurrency;
                    String categoryName = parsed.has("categoryName") ? parsed.get("categoryName").asText() : null;
                    String merchant = parsed.has("merchant") && !parsed.get("merchant").isNull() ? parsed.get("merchant").asText() : ruleMerchant;
                    String description = parsed.has("description") ? parsed.get("description").asText() : cleanedText;

                    Category matchedCategory = availableCategories.stream()
                            .filter(c -> c.getName().equalsIgnoreCase(categoryName))
                            .findFirst()
                            .orElse(availableCategories.isEmpty() ? null : availableCategories.get(0));

                    log.info("LLM parse successful for input: '{}' -> amount={}, category={}", rawText, amount, categoryName);

                    return ParsedExpenseDraftDto.builder()
                            .amount(amount)
                            .currency(currency)
                            .categoryId(matchedCategory != null ? matchedCategory.getId() : null)
                            .categoryName(matchedCategory != null ? matchedCategory.getName() : "Uncategorized")
                            .merchant(merchant)
                            .description(description)
                            .confidence(0.92)
                            .occurredAt(parseNaturalDate(rawText))
                            .rawInput(rawText)
                            .build();
                }
            } else {
                log.warn("Claude API returned non-200 status: {}", response.statusCode());
            }
        } catch (Exception e) {
            log.warn("LLM fallback parsing encountered an error; falling back to rule-based: {}", e.getMessage());
        }

        return null;
    }
}

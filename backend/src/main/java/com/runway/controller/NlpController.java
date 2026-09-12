package com.runway.controller;

import com.runway.dto.ParseTextRequest;
import com.runway.dto.ParsedExpenseDraftDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.NlpParserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nlp")
public class NlpController {

    private final NlpParserService nlpParserService;

    public NlpController(NlpParserService nlpParserService) {
        this.nlpParserService = nlpParserService;
    }

    @PostMapping("/parse")
    public ResponseEntity<ParsedExpenseDraftDto> parseText(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ParseTextRequest request) {
        ParsedExpenseDraftDto draft = nlpParserService.parseText(userDetails.getId(), request.getText());
        return ResponseEntity.ok(draft);
    }
}

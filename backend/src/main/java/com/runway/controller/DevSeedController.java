package com.runway.controller;

import com.runway.entity.User;
import com.runway.repository.UserRepository;
import com.runway.security.UserDetailsImpl;
import com.runway.service.DevSeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dev")
public class DevSeedController {

    private final DevSeedService seedService;
    private final UserRepository userRepository;

    public DevSeedController(DevSeedService seedService, UserRepository userRepository) {
        this.seedService = seedService;
        this.userRepository = userRepository;
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedData(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        UUID targetUserId;
        if (userDetails != null) {
            targetUserId = userDetails.getId();
        } else {
            // Default to sugeesh.murali@gmail.com or first available user
            targetUserId = userRepository.findByEmail("sugeesh.murali@gmail.com")
                    .map(User::getId)
                    .orElseGet(() -> userRepository.findAll().stream().findFirst().map(User::getId)
                            .orElseThrow(() -> new IllegalArgumentException("No user found to seed")));
        }

        Map<String, Object> result = seedService.seedDemoData(targetUserId);
        return ResponseEntity.ok(result);
    }
}

package com.runway.controller;

import com.runway.dto.UpdateUserSettingsRequest;
import com.runway.dto.UserDto;
import com.runway.security.UserDetailsImpl;
import com.runway.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        UserDto user = userService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateUserSettings(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateUserSettingsRequest request) {
        UserDto user = userService.updateUserSettings(userDetails.getId(), request);
        return ResponseEntity.ok(user);
    }
}

package com.runway.service;

import com.runway.dto.UpdateUserSettingsRequest;
import com.runway.dto.UserDto;
import com.runway.entity.User;
import com.runway.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUserSettings(UUID userId, UpdateUserSettingsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getDefaultCurrency() != null && !request.getDefaultCurrency().isBlank()) {
            user.setDefaultCurrency(request.getDefaultCurrency().toUpperCase().trim());
        }

        if (request.getMonthlyIncome() != null) {
            user.setMonthlyIncome(request.getMonthlyIncome());
        }

        user = userRepository.save(user);
        return mapToDto(user);
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .defaultCurrency(user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR")
                .monthlyIncome(user.getMonthlyIncome())
                .build();
    }
}

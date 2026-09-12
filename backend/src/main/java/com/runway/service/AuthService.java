package com.runway.service;

import com.runway.dto.*;
import com.runway.entity.PasswordResetToken;
import com.runway.entity.User;
import com.runway.repository.PasswordResetTokenRepository;
import com.runway.repository.UserRepository;
import com.runway.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Rate limiting map for forgot-password: email -> list of request timestamps in last 15 minutes
    private final Map<String, ConcurrentHashMap<Instant, Boolean>> rateLimitMap = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public record AuthResult(AuthResponse response, ResponseCookie refreshTokenCookie) {}

    @Transactional
    public AuthResult signup(SignupRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .defaultCurrency("INR")
                .build();

        user = userRepository.save(user);

        return createAuthResult(user);
    }

    @Transactional(readOnly = true)
    public AuthResult login(LoginRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return createAuthResult(user);
    }

    @Transactional(readOnly = true)
    public AuthResult refresh(String refreshToken) {
        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        UUID userId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return createAuthResult(user);
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        // Enforce Rate Limit: Max 3 requests per 15 minutes per email
        Instant now = Instant.now();
        Instant cutoff = now.minus(15, ChronoUnit.MINUTES);
        ConcurrentHashMap<Instant, Boolean> requests = rateLimitMap.computeIfAbsent(cleanEmail, k -> new ConcurrentHashMap<>());
        requests.keySet().removeIf(t -> t.isBefore(cutoff));

        if (requests.size() >= 3) {
            throw new IllegalArgumentException("Too many password reset requests. Please wait a few minutes before trying again.");
        }
        requests.put(now, Boolean.TRUE);

        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isEmpty()) {
            // Generic message to prevent email enumeration
            return new ForgotPasswordResponse("If an account exists for " + cleanEmail + ", a password reset link has been issued.", null);
        }

        User user = userOpt.get();

        // Remove previous tokens for this user
        resetTokenRepository.deleteByUser(user);

        // Generate new reset token (expires in 15 minutes)
        String tokenStr = UUID.randomUUID().toString();
        Instant expiresAt = now.plus(15, ChronoUnit.MINUTES);
        PasswordResetToken resetToken = new PasswordResetToken(user, tokenStr, expiresAt);
        resetTokenRepository.save(resetToken);

        String devResetLink = "http://localhost:5173/?resetToken=" + tokenStr;
        log.info("[DEV SMTP CATCHER] Password reset request for {}: {}", cleanEmail, devResetLink);

        return new ForgotPasswordResponse(
            "Password reset link generated. Check dev console / link below to reset.",
            devResetLink
        );
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (resetToken.getUsedAt() != null) {
            throw new IllegalArgumentException("This password reset token has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("This password reset token has expired. Please request a new link.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        resetTokenRepository.save(resetToken);
        log.info("Password successfully updated for user {}", user.getEmail());
    }

    private AuthResult createAuthResult(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        ResponseCookie cookie = jwtUtil.generateRefreshTokenCookie(refreshToken);

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .defaultCurrency(user.getDefaultCurrency() != null ? user.getDefaultCurrency() : "INR")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .user(userDto)
                .build();

        return new AuthResult(authResponse, cookie);
    }
}

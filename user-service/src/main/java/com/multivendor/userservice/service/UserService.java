package com.multivendor.userservice.service;

import com.multivendor.userservice.dto.*;
import com.multivendor.userservice.entity.User;
import com.multivendor.userservice.enums.Role;
import com.multivendor.userservice.exception.ApiException;
import com.multivendor.userservice.repository.UserRepository;
import com.multivendor.userservice.security.JwtService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public UserService(
      UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthResponse register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase();
    if (userRepository.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
    }
    User user = new User();
    user.setName(request.name().trim());
    user.setEmail(email);
    user.setPassword(passwordEncoder.encode(request.password()));
    user.setRole(request.role() != null ? request.role() : Role.CUSTOMER);
    User saved = userRepository.save(user);
    String token = jwtService.createToken(saved);
    return new AuthResponse(token, "Bearer", jwtService.getExpiration(), UserResponse.from(saved));
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    User user =
        userRepository
            .findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(
                () -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
    String token = jwtService.createToken(user);
    return new AuthResponse(token, "Bearer", jwtService.getExpiration(), UserResponse.from(user));
  }

  @Transactional(readOnly = true)
  public UserResponse getById(Long id) {
    User user =
        userRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + id));
    return UserResponse.from(user);
  }

  @Transactional(readOnly = true)
  public List<UserResponse> getAll() {
    return userRepository.findAll().stream().map(UserResponse::from).toList();
  }
}

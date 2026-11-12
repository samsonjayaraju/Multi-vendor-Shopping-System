package com.multivendor.userservice.dto;

import com.multivendor.userservice.entity.User;
import com.multivendor.userservice.enums.Role;
import java.time.Instant;

public record UserResponse(
    Long userId, String name, String email, Role role, Instant createdAt) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.getUserId(),
        user.getName(),
        user.getEmail(),
        user.getRole(),
        user.getCreatedAt());
  }
}

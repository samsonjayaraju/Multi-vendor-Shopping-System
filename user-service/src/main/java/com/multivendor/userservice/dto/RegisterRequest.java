package com.multivendor.userservice.dto;

import com.multivendor.userservice.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Name is required") @Size(max = 120) String name,
    @NotBlank(message = "Email is required") @Email(message = "Valid email is required") String email,
    @NotBlank(message = "Password is required") @Size(min = 6, max = 100, message = "Password must be at least 6 characters") String password,
    Role role) {}

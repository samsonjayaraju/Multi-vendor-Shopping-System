package com.multivendor.vendorservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VendorRequest(
    @NotBlank(message = "Vendor name is required") @Size(max = 140) String name,
    @NotBlank(message = "Email is required") @Email(message = "Valid email is required") String email,
    @NotBlank(message = "Contact number is required") @Size(min = 7, max = 30) String contactNumber,
    @Size(max = 400) String description,
    @Size(max = 120) String location) {}

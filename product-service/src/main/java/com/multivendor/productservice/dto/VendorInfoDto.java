package com.multivendor.productservice.dto;

public record VendorInfoDto(
    Long vendorId, Long userId, String name, String email, boolean active) {}

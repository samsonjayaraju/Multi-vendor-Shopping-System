package com.multivendor.orderservice.dto;

public record VendorInfoDto(
    Long vendorId, Long userId, String name, String email, boolean active) {}

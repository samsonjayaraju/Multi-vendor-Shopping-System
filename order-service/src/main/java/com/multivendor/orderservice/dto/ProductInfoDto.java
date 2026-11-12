package com.multivendor.orderservice.dto;

import java.math.BigDecimal;

public record ProductInfoDto(
    Long productId,
    Long vendorId,
    String vendorName,
    String name,
    BigDecimal price,
    Integer stockQuantity) {}

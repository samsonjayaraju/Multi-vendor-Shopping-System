package com.multivendor.productservice.dto;

import com.multivendor.productservice.entity.Product;
import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
    Long productId,
    Long vendorId,
    String vendorName,
    String name,
    String tagline,
    String description,
    String category,
    BigDecimal price,
    Integer stockQuantity,
    Instant createdAt) {
  public static ProductResponse from(Product p) {
    return new ProductResponse(
        p.getProductId(),
        p.getVendorId(),
        p.getVendorName(),
        p.getName(),
        p.getTagline(),
        p.getDescription(),
        p.getCategory(),
        p.getPrice(),
        p.getStockQuantity(),
        p.getCreatedAt());
  }
}

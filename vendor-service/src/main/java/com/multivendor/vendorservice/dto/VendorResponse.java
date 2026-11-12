package com.multivendor.vendorservice.dto;

import com.multivendor.vendorservice.entity.Vendor;
import java.time.Instant;

public record VendorResponse(
    Long vendorId,
    Long userId,
    String name,
    String email,
    String contactNumber,
    String description,
    String location,
    boolean active,
    Instant createdAt) {
  public static VendorResponse from(Vendor v) {
    return new VendorResponse(
        v.getVendorId(),
        v.getUserId(),
        v.getName(),
        v.getEmail(),
        v.getContactNumber(),
        v.getDescription(),
        v.getLocation(),
        v.isActive(),
        v.getCreatedAt());
  }
}
